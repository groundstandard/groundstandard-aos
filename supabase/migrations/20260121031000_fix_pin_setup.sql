-- Fix PIN check-in system and provide PIN management
-- 1. Update RPC to handle missing PINs gracefully
-- 2. Create function to generate/assign PINs to students
-- 3. Add PIN management for admins

-- Improved check_in_with_pin function with better error handling
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

  -- Find student by PIN
  SELECT id, first_name, last_name, membership_status, check_in_pin
  INTO student_record
  FROM profiles
  WHERE check_in_pin = pin_code;
  
  -- Check if PIN exists in system
  IF student_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'PIN not found. Please contact staff to set up your PIN.'
    );
  END IF;

  -- Check if student has active membership
  IF student_record.membership_status != 'active' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Membership is not active. Please contact staff.',
      'student_name', student_record.first_name || ' ' || student_record.last_name
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

-- Function to generate a unique 4-digit PIN for a student
CREATE OR REPLACE FUNCTION public.generate_student_pin(student_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_pin TEXT;
  pin_exists BOOLEAN;
  attempts INTEGER := 0;
  max_attempts INTEGER := 100;
BEGIN
  -- Check if user has permission (admin/owner only)
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'owner')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Permission denied. Only admins can assign PINs.'
    );
  END IF;

  -- Check if student exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = student_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Student not found'
    );
  END IF;

  -- Generate unique PIN
  LOOP
    -- Generate random 4-digit PIN (1000-9999)
    new_pin := LPAD((FLOOR(RANDOM() * 9000) + 1000)::TEXT, 4, '0');
    
    -- Check if PIN already exists
    SELECT EXISTS(
      SELECT 1 FROM public.profiles 
      WHERE check_in_pin = new_pin
    ) INTO pin_exists;
    
    attempts := attempts + 1;
    
    -- Exit if PIN is unique or max attempts reached
    EXIT WHEN NOT pin_exists OR attempts >= max_attempts;
  END LOOP;

  -- If we couldn't generate unique PIN
  IF pin_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Could not generate unique PIN. Please try again.'
    );
  END IF;

  -- Assign PIN to student
  UPDATE public.profiles 
  SET check_in_pin = new_pin,
      updated_at = now()
  WHERE id = student_id;

  RETURN jsonb_build_object(
    'success', true,
    'pin', new_pin,
    'message', 'PIN assigned successfully'
  );
END;
$$;

-- Function to get all students without PINs (for admin use)
CREATE OR REPLACE FUNCTION public.get_students_without_pins()
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  email text,
  membership_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if user has permission (admin/owner only)
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'owner')
  ) THEN
    RAISE EXCEPTION 'Permission denied. Only admins can view this data.';
  END IF;

  RETURN QUERY
  SELECT p.id, p.first_name, p.last_name, p.email, p.membership_status
  FROM public.profiles p
  WHERE p.role = 'student' 
    AND (p.check_in_pin IS NULL OR p.check_in_pin = '')
  ORDER BY p.last_name, p.first_name;
END;
$$;

-- Grant permissions
REVOKE ALL ON FUNCTION public.check_in_with_pin(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_in_with_pin(text, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.generate_student_pin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_student_pin(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.get_students_without_pins() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_students_without_pins() TO authenticated;
