-- Create automation settings table
CREATE TABLE public.automation_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booked_lead BOOLEAN NOT NULL DEFAULT false,
  member_signed BOOLEAN NOT NULL DEFAULT false,
  member_cancelled BOOLEAN NOT NULL DEFAULT false,
  member_absent BOOLEAN NOT NULL DEFAULT false,
  member_present BOOLEAN NOT NULL DEFAULT false,
  member_delinquent BOOLEAN NOT NULL DEFAULT false,
  member_current BOOLEAN NOT NULL DEFAULT false,
  absent_days_threshold INTEGER NOT NULL DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create HighLevel configuration table
CREATE TABLE public.highlevel_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key TEXT,
  subaccount_id TEXT,
  webhook_url TEXT,
  is_connected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create automation logs table to track when automations fire
CREATE TABLE public.automation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_type TEXT NOT NULL,
  contact_id UUID,
  trigger_data JSONB,
  highlevel_response JSONB,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlevel_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only admins can manage automations
CREATE POLICY "Admins can manage automation settings" 
ON public.automation_settings 
FOR ALL 
USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can manage HighLevel config" 
ON public.highlevel_config 
FOR ALL 
USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can view automation logs" 
ON public.automation_logs 
FOR SELECT 
USING (get_current_user_role() = 'admin');

CREATE POLICY "System can insert automation logs" 
ON public.automation_logs 
FOR INSERT 
WITH CHECK (true);

-- Insert default settings
INSERT INTO public.automation_settings (id) VALUES (gen_random_uuid());
INSERT INTO public.highlevel_config (id) VALUES (gen_random_uuid());

-- Create trigger for updated_at
CREATE TRIGGER update_automation_settings_updated_at
  BEFORE UPDATE ON public.automation_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_highlevel_config_updated_at
  BEFORE UPDATE ON public.highlevel_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();