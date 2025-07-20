-- Add PIN field to profiles table for check-in functionality
ALTER TABLE public.profiles 
ADD COLUMN check_in_pin TEXT;

-- Create index for faster PIN lookups
CREATE INDEX idx_profiles_check_in_pin ON public.profiles(check_in_pin) WHERE check_in_pin IS NOT NULL;

-- Function to generate random 4-digit PIN
CREATE OR REPLACE FUNCTION generate_check_in_pin()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_pin TEXT;
  pin_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 4-digit PIN
    new_pin := LPAD((RANDOM() * 9999)::INTEGER::TEXT, 4, '0');
    
    -- Check if PIN already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE check_in_pin = new_pin) INTO pin_exists;
    
    -- If PIN doesn't exist, we can use it
    IF NOT pin_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_pin;
END;
$$;

-- Function to auto-generate PINs for existing users without them
UPDATE public.profiles 
SET check_in_pin = generate_check_in_pin() 
WHERE check_in_pin IS NULL AND membership_status = 'active';

-- Create settings table for kiosk mode configuration
CREATE TABLE public.check_in_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosk_mode_enabled BOOLEAN DEFAULT false,
  auto_checkout_hours INTEGER DEFAULT 24,
  require_class_selection BOOLEAN DEFAULT true,
  welcome_message TEXT DEFAULT 'Welcome! Please enter your 4-digit PIN to check in.',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default settings
INSERT INTO public.check_in_settings (kiosk_mode_enabled, auto_checkout_hours, require_class_selection, welcome_message)
VALUES (false, 24, true, 'Welcome! Please enter your 4-digit PIN to check in.');

-- Enable RLS on check_in_settings
ALTER TABLE public.check_in_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for check_in_settings
CREATE POLICY "Admins and owners can manage check-in settings"
ON public.check_in_settings
FOR ALL
USING (get_current_user_role() = ANY(ARRAY['admin', 'owner']));

-- Function to handle PIN-based check-in
CREATE OR REPLACE FUNCTION public.check_in_with_pin(pin_code TEXT, class_id_param UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  student_record RECORD;
  attendance_id UUID;
  today_date DATE := CURRENT_DATE;
  existing_attendance UUID;
BEGIN
  -- Find student by PIN
  SELECT id, first_name, last_name, membership_status
  INTO student_record
  FROM public.profiles
  WHERE check_in_pin = pin_code AND membership_status = 'active';
  
  -- Check if student exists
  IF student_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid PIN or inactive membership'
    );
  END IF;
  
  -- Check if already checked in today
  SELECT id INTO existing_attendance
  FROM public.attendance
  WHERE student_id = student_record.id 
    AND date = today_date 
    AND status = 'present';
  
  IF existing_attendance IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Already checked in today',
      'student_name', student_record.first_name || ' ' || student_record.last_name
    );
  END IF;
  
  -- Create attendance record
  INSERT INTO public.attendance (student_id, class_id, date, status, notes)
  VALUES (
    student_record.id,
    class_id_param,
    today_date,
    'present',
    'Check-in via PIN'
  )
  RETURNING id INTO attendance_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'student_name', student_record.first_name || ' ' || student_record.last_name,
    'attendance_id', attendance_id
  );
END;
$$;