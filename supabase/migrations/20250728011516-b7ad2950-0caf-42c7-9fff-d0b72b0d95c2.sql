-- Fix the last remaining database function security warning

-- Fix set_attendance_academy_id function
CREATE OR REPLACE FUNCTION public.set_attendance_academy_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Set academy_id based on student's active academy membership
  SELECT am.academy_id INTO NEW.academy_id
  FROM academy_memberships am
  WHERE am.user_id = NEW.student_id 
  AND am.is_active = true
  LIMIT 1;
  
  RETURN NEW;
END;
$function$;