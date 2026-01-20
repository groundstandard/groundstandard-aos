-- Fix check-in settings and RPC issues
-- Ensure check_in_settings table exists and has default data

-- Create check_in_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.check_in_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosk_mode_enabled BOOLEAN DEFAULT false,
  auto_checkout_hours INTEGER DEFAULT 24,
  require_class_selection BOOLEAN DEFAULT true,
  welcome_message TEXT DEFAULT 'Welcome! Please enter your 4-digit PIN to check in.',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default settings if table is empty
INSERT INTO public.check_in_settings (kiosk_mode_enabled, auto_checkout_hours, require_class_selection, welcome_message)
SELECT false, 24, true, 'Welcome! Please enter your 4-digit PIN to check in.'
WHERE NOT EXISTS (SELECT 1 FROM public.check_in_settings);

-- Enable RLS on check_in_settings
ALTER TABLE public.check_in_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins and owners can manage check-in settings" ON public.check_in_settings;

-- RLS policies for check_in_settings
CREATE POLICY "Admins and owners can manage check-in settings"
ON public.check_in_settings
FOR ALL
USING (get_current_user_role() = ANY(ARRAY['admin', 'owner']));

-- Fix check_in_with_pin function to handle missing check_in_pin column gracefully
CREATE OR REPLACE FUNCTION public.check_in_with_pin(pin_code text, class_id_param uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  student_record RECORD;
  attendance_id UUID;
  today_date DATE := CURRENT_DATE;
  existing_attendance UUID;
BEGIN
  -- Validate PIN format
  IF pin_code IS NULL OR length(trim(pin_code)) != 4 OR NOT (trim(pin_code) ~ '^[0-9]{4}$') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'PIN must be exactly 4 digits'
    );
  END IF;

  -- Find student by PIN (handle case where check_in_pin column might not exist)
  BEGIN
    SELECT id, first_name, last_name, membership_status
    INTO student_record
    FROM profiles
    WHERE check_in_pin = pin_code AND membership_status = 'active';
  EXCEPTION WHEN undefined_column THEN
    -- If check_in_pin column doesn't exist, return appropriate error
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Check-in PIN system not configured. Please contact admin.'
    );
  END;
  
  -- Check if student exists
  IF student_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid PIN or inactive membership'
    );
  END IF;
  
  -- Check if already checked in today
  SELECT id INTO existing_attendance
  FROM attendance
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
  INSERT INTO attendance (student_id, class_id, date, status, notes)
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

-- Grant execute permissions
REVOKE ALL ON FUNCTION public.check_in_with_pin(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_in_with_pin(text, uuid) TO authenticated;

-- Add check_in_pin column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'check_in_pin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN check_in_pin TEXT;
    CREATE INDEX IF NOT EXISTS idx_profiles_check_in_pin ON public.profiles(check_in_pin);
  END IF;
END $$;
