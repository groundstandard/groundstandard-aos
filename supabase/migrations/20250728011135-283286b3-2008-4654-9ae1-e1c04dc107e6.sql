-- Final cleanup of remaining database function security warnings

-- Fix get_user_academies function
CREATE OR REPLACE FUNCTION public.get_user_academies(target_user_id uuid DEFAULT auth.uid())
 RETURNS TABLE(academy_id uuid, role text, academy_name text, city text, state text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    -- Check if user has only student roles
    SELECT 
        am.academy_id,
        am.role,
        a.name as academy_name,
        a.city,
        a.state
    FROM academy_memberships am
    JOIN academies a ON am.academy_id = a.id
    WHERE am.user_id = target_user_id 
    AND am.is_active = true
    -- If user has any admin/owner roles, show all. Otherwise show only student roles
    AND (
        EXISTS (
            SELECT 1 FROM academy_memberships am2 
            WHERE am2.user_id = target_user_id 
            AND am2.role IN ('owner', 'admin') 
            AND am2.is_active = true
        ) OR am.role = 'student'
    )
    ORDER BY am.joined_at DESC;
$function$;

-- Fix switch_user_academy function
CREATE OR REPLACE FUNCTION public.switch_user_academy(target_academy_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_id_val uuid := auth.uid();
    has_access boolean := false;
    old_academy_id uuid;
BEGIN
    -- Check if user has access to the target academy
    SELECT EXISTS (
        SELECT 1 FROM academy_memberships
        WHERE user_id = user_id_val 
        AND academy_id = target_academy_id 
        AND is_active = true
    ) INTO has_access;
    
    IF NOT has_access THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Access denied to academy'
        );
    END IF;
    
    -- Get current academy for logging
    SELECT last_academy_id INTO old_academy_id
    FROM profiles
    WHERE id = user_id_val;
    
    -- Update the user's profile
    UPDATE profiles 
    SET last_academy_id = target_academy_id,
        updated_at = now()
    WHERE id = user_id_val;
    
    -- Log the academy switch
    INSERT INTO academy_switches (
        user_id,
        from_academy_id,
        to_academy_id
    ) VALUES (
        user_id_val,
        old_academy_id,
        target_academy_id
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'old_academy_id', old_academy_id,
        'new_academy_id', target_academy_id
    );
END;
$function$;

-- Fix get_instructor_classes_today function
CREATE OR REPLACE FUNCTION public.get_instructor_classes_today(instructor_uuid uuid)
 RETURNS TABLE(class_id uuid, class_name text, start_time time without time zone, end_time time without time zone, max_students integer, day_of_week integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    c.id as class_id,
    c.name as class_name,
    cs.start_time,
    cs.end_time,
    c.max_students,
    cs.day_of_week
  FROM classes c
  JOIN class_schedules cs ON c.id = cs.class_id
  WHERE c.instructor_id = instructor_uuid
  AND c.is_active = true
  AND cs.day_of_week = EXTRACT(DOW FROM CURRENT_DATE);
$function$;

-- Fix get_class_enrolled_students function
CREATE OR REPLACE FUNCTION public.get_class_enrolled_students(class_uuid uuid)
 RETURNS TABLE(student_id uuid, first_name text, last_name text, email text, belt_level text, enrollment_status text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.id as student_id,
    p.first_name,
    p.last_name,
    p.email,
    p.belt_level,
    ce.status as enrollment_status
  FROM class_enrollments ce
  JOIN profiles p ON ce.student_id = p.id
  WHERE ce.class_id = class_uuid
  AND ce.status = 'active'
  ORDER BY p.last_name, p.first_name;
$function$;

-- Fix trigger_highlevel_automation function
CREATE OR REPLACE FUNCTION public.trigger_highlevel_automation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Simple version - just return without doing anything
  -- This prevents all the errors while we focus on getting attendance data working
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'student'  -- Force all new users to student role
  );
  RETURN NEW;
END;
$function$;

-- Fix update_user_role function
CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id uuid, new_role text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Get current user's role
  SELECT role INTO current_user_role 
  FROM profiles 
  WHERE id = auth.uid();
  
  -- Only admins can change roles
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can modify user roles';
  END IF;
  
  -- Update the target user's role
  UPDATE profiles 
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;
  
  RETURN FOUND;
END;
$function$;