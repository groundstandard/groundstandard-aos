-- Create payment_plans table
CREATE TABLE public.payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  interval_type TEXT NOT NULL, -- 'monthly', 'weekly', 'yearly'
  interval_count INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create family_discounts table
CREATE TABLE public.family_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_name TEXT NOT NULL,
  primary_student_id UUID NOT NULL,
  discount_percentage INTEGER NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  discount_amount INTEGER, -- Amount in cents
  max_family_members INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create automated_messages table
CREATE TABLE public.automated_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL, -- 'attendance_reminder', 'payment_due', 'belt_test_reminder', etc.
  trigger_conditions JSONB, -- Conditions for when to send
  template_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create message_templates table
CREATE TABLE public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL, -- 'email', 'sms', 'push'
  variables JSONB, -- Available variables for template
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create export_logs table
CREATE TABLE public.export_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_type TEXT NOT NULL, -- 'students', 'payments', 'attendance', etc.
  file_name TEXT NOT NULL,
  file_size INTEGER,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  exported_by UUID,
  download_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS on all tables
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automated_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment_plans
CREATE POLICY "Admins can manage payment plans" ON public.payment_plans
  FOR ALL USING (get_current_user_role() = 'admin');

CREATE POLICY "Everyone can view active payment plans" ON public.payment_plans
  FOR SELECT USING (is_active = true);

-- Create RLS policies for family_discounts
CREATE POLICY "Admins can manage family discounts" ON public.family_discounts
  FOR ALL USING (get_current_user_role() = 'admin');

-- Create RLS policies for automated_messages
CREATE POLICY "Admins can manage automated messages" ON public.automated_messages
  FOR ALL USING (get_current_user_role() = 'admin');

-- Create RLS policies for message_templates
CREATE POLICY "Admins can manage message templates" ON public.message_templates
  FOR ALL USING (get_current_user_role() = 'admin');

-- Create RLS policies for export_logs
CREATE POLICY "Admins can manage export logs" ON public.export_logs
  FOR ALL USING (get_current_user_role() = 'admin');

CREATE POLICY "Users can view their own export logs" ON public.export_logs
  FOR SELECT USING (exported_by = auth.uid());

-- Create triggers for updated_at columns
CREATE TRIGGER update_payment_plans_updated_at
  BEFORE UPDATE ON public.payment_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_discounts_updated_at
  BEFORE UPDATE ON public.family_discounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automated_messages_updated_at
  BEFORE UPDATE ON public.automated_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();