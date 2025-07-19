-- Create communication logs table
CREATE TABLE public.communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL, -- 'email', 'sms', 'phone', 'in_person', 'note'
  subject TEXT,
  content TEXT NOT NULL,
  sent_by UUID REFERENCES public.profiles(id),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create family relationships table
CREATE TABLE public.family_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_contact_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  related_contact_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- 'parent', 'child', 'sibling', 'guardian', 'spouse'
  is_emergency_contact BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(primary_contact_id, related_contact_id)
);

-- Create contact imports table for tracking import history
CREATE TABLE public.contact_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  total_records INTEGER NOT NULL,
  successful_imports INTEGER NOT NULL,
  failed_imports INTEGER NOT NULL,
  imported_by UUID REFERENCES public.profiles(id),
  import_status TEXT NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  error_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contact activities table for comprehensive timeline
CREATE TABLE public.contact_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'payment', 'attendance', 'communication', 'status_change', 'belt_test', 'membership_change'
  activity_title TEXT NOT NULL,
  activity_description TEXT,
  activity_data JSONB, -- Store additional activity-specific data
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for communication_logs
CREATE POLICY "Admins can manage all communication logs" ON public.communication_logs
  FOR ALL USING (get_current_user_role() = 'admin');

CREATE POLICY "Users can view their own communication logs" ON public.communication_logs
  FOR SELECT USING (contact_id = auth.uid());

-- Create RLS policies for family_relationships
CREATE POLICY "Admins can manage family relationships" ON public.family_relationships
  FOR ALL USING (get_current_user_role() = 'admin');

CREATE POLICY "Users can view their family relationships" ON public.family_relationships
  FOR SELECT USING (primary_contact_id = auth.uid() OR related_contact_id = auth.uid());

-- Create RLS policies for contact_imports
CREATE POLICY "Admins can manage contact imports" ON public.contact_imports
  FOR ALL USING (get_current_user_role() = 'admin');

-- Create RLS policies for contact_activities
CREATE POLICY "Admins can manage contact activities" ON public.contact_activities
  FOR ALL USING (get_current_user_role() = 'admin');

CREATE POLICY "Users can view their own activities" ON public.contact_activities
  FOR SELECT USING (contact_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_communication_logs_contact_id ON public.communication_logs(contact_id);
CREATE INDEX idx_communication_logs_sent_at ON public.communication_logs(sent_at);
CREATE INDEX idx_family_relationships_primary ON public.family_relationships(primary_contact_id);
CREATE INDEX idx_family_relationships_related ON public.family_relationships(related_contact_id);
CREATE INDEX idx_contact_activities_contact_id ON public.contact_activities(contact_id);
CREATE INDEX idx_contact_activities_created_at ON public.contact_activities(created_at);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_family_relationships_updated_at
  BEFORE UPDATE ON public.family_relationships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically log contact activities
CREATE OR REPLACE FUNCTION public.log_contact_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log payment activities
  IF TG_TABLE_NAME = 'payments' AND TG_OP = 'INSERT' THEN
    INSERT INTO public.contact_activities (
      contact_id, 
      activity_type, 
      activity_title, 
      activity_description,
      activity_data
    ) VALUES (
      NEW.student_id,
      'payment',
      'Payment Received',
      'Payment of $' || (NEW.amount / 100.0) || ' received',
      jsonb_build_object(
        'amount', NEW.amount,
        'payment_method', NEW.payment_method,
        'description', NEW.description
      )
    );
  END IF;

  -- Log attendance activities
  IF TG_TABLE_NAME = 'attendance' AND TG_OP = 'INSERT' THEN
    INSERT INTO public.contact_activities (
      contact_id,
      activity_type,
      activity_title,
      activity_description,
      activity_data
    ) VALUES (
      NEW.student_id,
      'attendance',
      'Class Attendance',
      'Marked ' || NEW.status || ' for class on ' || NEW.date,
      jsonb_build_object(
        'status', NEW.status,
        'date', NEW.date,
        'notes', NEW.notes
      )
    );
  END IF;

  -- Log belt test activities
  IF TG_TABLE_NAME = 'belt_tests' AND TG_OP = 'INSERT' THEN
    INSERT INTO public.contact_activities (
      contact_id,
      activity_type,
      activity_title,
      activity_description,
      activity_data
    ) VALUES (
      NEW.student_id,
      'belt_test',
      'Belt Test Scheduled',
      'Belt test from ' || NEW.current_belt || ' to ' || NEW.target_belt || ' scheduled for ' || NEW.test_date,
      jsonb_build_object(
        'current_belt', NEW.current_belt,
        'target_belt', NEW.target_belt,
        'test_date', NEW.test_date,
        'status', NEW.status
      )
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic activity logging
CREATE TRIGGER trigger_log_payment_activity
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_contact_activity();

CREATE TRIGGER trigger_log_attendance_activity
  AFTER INSERT ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.log_contact_activity();

CREATE TRIGGER trigger_log_belt_test_activity
  AFTER INSERT ON public.belt_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_contact_activity();