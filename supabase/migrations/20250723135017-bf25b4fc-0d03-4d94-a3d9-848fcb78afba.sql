-- Create class schedule versions table for historical tracking
CREATE TABLE public.class_schedule_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES public.class_schedules(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  change_reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_effective_dates CHECK (effective_to IS NULL OR effective_to > effective_from)
);

-- Create belt progressions table
CREATE TABLE public.belt_progressions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  belt_level TEXT NOT NULL,
  minimum_time_months INTEGER NOT NULL DEFAULT 3,
  minimum_classes_required INTEGER NOT NULL DEFAULT 20,
  next_belt_level TEXT,
  belt_order INTEGER NOT NULL,
  description TEXT,
  requirements JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(belt_level, belt_order)
);

-- Create student belt history table
CREATE TABLE public.student_belt_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  belt_level TEXT NOT NULL,
  promoted_date DATE NOT NULL DEFAULT CURRENT_DATE,
  promoted_by UUID REFERENCES auth.users(id),
  classes_completed_at_previous_belt INTEGER DEFAULT 0,
  time_at_previous_belt_months INTEGER DEFAULT 0,
  test_score JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Rename class_enrollments to class_reservations
ALTER TABLE public.class_enrollments RENAME TO class_reservations;

-- Update column names to match reservation terminology
ALTER TABLE public.class_reservations RENAME COLUMN enrolled_at TO reserved_at;
ALTER TABLE public.class_reservations RENAME COLUMN enrollment_type TO reservation_type;

-- Add reservation status fields
ALTER TABLE public.class_reservations 
ADD COLUMN checked_in_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN check_in_location JSONB,
ADD COLUMN no_show BOOLEAN DEFAULT false,
ADD COLUMN cancellation_reason TEXT;

-- Update status values to match new terminology
UPDATE public.class_reservations 
SET status = CASE 
  WHEN status = 'active' THEN 'reserved'
  WHEN status = 'inactive' THEN 'cancelled'
  ELSE status
END;

-- Create comprehensive audit log table
CREATE TABLE public.audit_logs_comprehensive (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'bulk_update', etc.
  table_name TEXT NOT NULL,
  record_id UUID,
  record_identifier TEXT, -- human readable identifier (name, email, etc.)
  old_values JSONB,
  new_values JSONB,
  change_summary TEXT,
  module_name TEXT, -- 'schedules', 'students', 'attendance', etc.
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.class_schedule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.belt_progressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_belt_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs_comprehensive ENABLE ROW LEVEL SECURITY;

-- RLS Policies for class_schedule_versions
CREATE POLICY "Academy members can view schedule versions" 
ON public.class_schedule_versions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM academy_memberships am
    JOIN classes c ON c.id = class_schedule_versions.class_id
    WHERE am.user_id = auth.uid() 
    AND am.is_active = true
  )
);

CREATE POLICY "Admins can manage schedule versions" 
ON public.class_schedule_versions 
FOR ALL 
USING (get_current_user_role() = ANY(ARRAY['admin', 'owner']));

-- RLS Policies for belt_progressions
CREATE POLICY "Everyone can view belt progressions" 
ON public.belt_progressions 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage belt progressions" 
ON public.belt_progressions 
FOR ALL 
USING (get_current_user_role() = ANY(ARRAY['admin', 'owner']));

-- RLS Policies for student_belt_history
CREATE POLICY "Students can view their own belt history" 
ON public.student_belt_history 
FOR SELECT 
USING (student_id = auth.uid());

CREATE POLICY "Academy members can view belt history within academy" 
ON public.student_belt_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM academy_memberships am1
    JOIN academy_memberships am2 ON am1.academy_id = am2.academy_id
    WHERE am1.user_id = auth.uid() 
    AND am2.user_id = student_belt_history.student_id
    AND am1.is_active = true 
    AND am2.is_active = true
  )
);

CREATE POLICY "Admins can manage belt history" 
ON public.student_belt_history 
FOR ALL 
USING (get_current_user_role() = ANY(ARRAY['admin', 'owner', 'instructor']));

-- RLS Policies for audit_logs_comprehensive
CREATE POLICY "Admins can view all audit logs" 
ON public.audit_logs_comprehensive 
FOR SELECT 
USING (get_current_user_role() = ANY(ARRAY['admin', 'owner']));

CREATE POLICY "System can insert audit logs" 
ON public.audit_logs_comprehensive 
FOR INSERT 
WITH CHECK (true);

-- Create function to track schedule changes
CREATE OR REPLACE FUNCTION public.track_schedule_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Archive old schedule version
    INSERT INTO public.class_schedule_versions (
      class_id, schedule_id, day_of_week, start_time, end_time,
      effective_from, effective_to, change_reason, created_by
    )
    SELECT 
      OLD.class_id, OLD.id, OLD.day_of_week, OLD.start_time, OLD.end_time,
      CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE - INTERVAL '1 day',
      'Schedule updated', auth.uid()
    WHERE OLD.day_of_week != NEW.day_of_week 
       OR OLD.start_time != NEW.start_time 
       OR OLD.end_time != NEW.end_time;
    
    -- Create new version
    INSERT INTO public.class_schedule_versions (
      class_id, schedule_id, day_of_week, start_time, end_time,
      effective_from, change_reason, created_by
    ) VALUES (
      NEW.class_id, NEW.id, NEW.day_of_week, NEW.start_time, NEW.end_time,
      CURRENT_DATE, 'Schedule updated', auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for schedule change tracking
CREATE TRIGGER track_class_schedule_changes
  AFTER UPDATE ON public.class_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.track_schedule_changes();

-- Create comprehensive audit trigger function
CREATE OR REPLACE FUNCTION public.log_comprehensive_audit()
RETURNS TRIGGER AS $$
DECLARE
  record_name TEXT;
BEGIN
  -- Determine human-readable identifier
  CASE TG_TABLE_NAME
    WHEN 'profiles' THEN 
      record_name := COALESCE(NEW.first_name || ' ' || NEW.last_name, OLD.first_name || ' ' || OLD.last_name);
    WHEN 'classes' THEN 
      record_name := COALESCE(NEW.name, OLD.name);
    WHEN 'class_schedules' THEN 
      record_name := 'Schedule for class';
    ELSE 
      record_name := COALESCE(NEW.id::text, OLD.id::text);
  END CASE;

  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs_comprehensive (
      user_id, action, table_name, record_id, record_identifier,
      old_values, module_name
    ) VALUES (
      auth.uid(), 'delete', TG_TABLE_NAME, OLD.id, record_name,
      to_jsonb(OLD), 
      CASE TG_TABLE_NAME
        WHEN 'class_schedules' THEN 'schedules'
        WHEN 'classes' THEN 'schedules'
        WHEN 'profiles' THEN 'students'
        WHEN 'attendance' THEN 'attendance'
        ELSE 'system'
      END
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs_comprehensive (
      user_id, action, table_name, record_id, record_identifier,
      old_values, new_values, module_name
    ) VALUES (
      auth.uid(), 'update', TG_TABLE_NAME, NEW.id, record_name,
      to_jsonb(OLD), to_jsonb(NEW),
      CASE TG_TABLE_NAME
        WHEN 'class_schedules' THEN 'schedules'
        WHEN 'classes' THEN 'schedules'
        WHEN 'profiles' THEN 'students'
        WHEN 'attendance' THEN 'attendance'
        ELSE 'system'
      END
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs_comprehensive (
      user_id, action, table_name, record_id, record_identifier,
      new_values, module_name
    ) VALUES (
      auth.uid(), 'create', TG_TABLE_NAME, NEW.id, record_name,
      to_jsonb(NEW),
      CASE TG_TABLE_NAME
        WHEN 'class_schedules' THEN 'schedules'
        WHEN 'classes' THEN 'schedules'
        WHEN 'profiles' THEN 'students'
        WHEN 'attendance' THEN 'attendance'
        ELSE 'system'
      END
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for comprehensive audit logging
CREATE TRIGGER audit_classes_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.log_comprehensive_audit();

CREATE TRIGGER audit_schedules_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.class_schedules
  FOR EACH ROW EXECUTE FUNCTION public.log_comprehensive_audit();

CREATE TRIGGER audit_profiles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_comprehensive_audit();

CREATE TRIGGER audit_attendance_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.log_comprehensive_audit();

-- Update triggers for automatic timestamp updates
CREATE TRIGGER update_belt_progressions_updated_at
BEFORE UPDATE ON public.belt_progressions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default belt progression data
INSERT INTO public.belt_progressions (belt_level, minimum_time_months, minimum_classes_required, next_belt_level, belt_order, description) VALUES
('White', 3, 20, 'Yellow', 1, 'Beginner level - focus on basic techniques'),
('Yellow', 4, 25, 'Orange', 2, 'Developing fundamental skills'),
('Orange', 4, 30, 'Green', 3, 'Building consistency and form'),
('Green', 6, 35, 'Blue', 4, 'Intermediate techniques and sparring'),
('Blue', 6, 40, 'Purple', 5, 'Advanced combinations and tactics'),
('Purple', 8, 45, 'Brown', 6, 'Leadership and teaching preparation'),
('Brown', 12, 60, 'Black', 7, 'Mastery of fundamentals, preparing for black belt'),
('Black', 24, 100, 'Black 2nd Degree', 8, 'Teaching and advanced technique mastery');