-- Final batch of database function security warnings fixes - Part 4

-- Fix check_in_with_pin function
CREATE OR REPLACE FUNCTION public.check_in_with_pin(pin_code text, class_id_param uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  student_record RECORD;
  attendance_id UUID;
  today_date DATE := CURRENT_DATE;
  existing_attendance UUID;
BEGIN
  -- Find student by PIN
  SELECT id, first_name, last_name, membership_status
  INTO student_record
  FROM profiles
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
$function$;

-- Fix can_contact_enroll_in_class function
CREATE OR REPLACE FUNCTION public.can_contact_enroll_in_class(contact_uuid uuid, class_uuid uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  active_subscription RECORD;
  class_access RECORD;
  current_enrollments INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Get active subscription
  SELECT ms.*, mp.max_classes_per_week, mp.billing_frequency
  INTO active_subscription
  FROM membership_subscriptions ms
  JOIN membership_plans mp ON ms.membership_plan_id = mp.id
  WHERE ms.profile_id = contact_uuid 
  AND ms.status = 'active'
  LIMIT 1;

  -- Check if subscription exists
  IF active_subscription IS NULL THEN
    RETURN jsonb_build_object(
      'can_enroll', false,
      'reason', 'No active membership',
      'requires_payment', true
    );
  END IF;

  -- Get class access permissions
  SELECT cap.*
  INTO class_access
  FROM class_access_permissions cap
  WHERE cap.membership_plan_id = active_subscription.membership_plan_id
  AND cap.class_id = class_uuid;

  -- Check if class is restricted
  IF class_access IS NULL OR class_access.access_type = 'restricted' THEN
    RETURN jsonb_build_object(
      'can_enroll', false,
      'reason', 'Class not included in membership plan',
      'requires_payment', true,
      'additional_fee_cents', COALESCE(class_access.additional_fee_cents, 0)
    );
  END IF;

  -- Check session limits if applicable
  IF class_access.max_sessions_per_period IS NOT NULL THEN
    -- Count current enrollments in the period
    SELECT COUNT(*)
    INTO current_enrollments
    FROM class_enrollments ce
    JOIN attendance a ON ce.student_id = a.student_id AND ce.class_id = a.class_id
    WHERE ce.student_id = contact_uuid
    AND ce.class_id = class_uuid
    AND ce.status = 'active'
    AND CASE class_access.period_type
      WHEN 'daily' THEN a.date >= CURRENT_DATE
      WHEN 'weekly' THEN a.date >= date_trunc('week', CURRENT_DATE)::date
      WHEN 'monthly' THEN a.date >= date_trunc('month', CURRENT_DATE)::date
    END;

    IF current_enrollments >= class_access.max_sessions_per_period THEN
      RETURN jsonb_build_object(
        'can_enroll', false,
        'reason', 'Session limit reached for this period',
        'requires_payment', class_access.access_type = 'additional_fee',
        'additional_fee_cents', COALESCE(class_access.additional_fee_cents, 0)
      );
    END IF;
  END IF;

  -- Can enroll
  RETURN jsonb_build_object(
    'can_enroll', true,
    'access_type', class_access.access_type,
    'additional_fee_cents', CASE 
      WHEN class_access.access_type = 'additional_fee' THEN COALESCE(class_access.additional_fee_cents, 0)
      ELSE 0
    END
  );
END;
$function$;

-- Fix check_subscription_access function
CREATE OR REPLACE FUNCTION public.check_subscription_access(required_tier text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_subscription_tier TEXT;
  is_active BOOLEAN;
BEGIN
  SELECT subscription_tier, (subscription_status = 'active' OR subscription_status = 'trialing')
  INTO user_subscription_tier, is_active
  FROM subscribers
  WHERE user_id = auth.uid();
  
  -- If no subscription found, allow free tier
  IF user_subscription_tier IS NULL THEN
    RETURN required_tier = 'free';
  END IF;
  
  -- If not active, deny access
  IF NOT is_active THEN
    RETURN false;
  END IF;
  
  -- Check tier hierarchy: Starter < Professional < Enterprise
  CASE required_tier
    WHEN 'free' THEN RETURN true;
    WHEN 'Starter' THEN RETURN user_subscription_tier IN ('Starter', 'Professional', 'Enterprise');
    WHEN 'Professional' THEN RETURN user_subscription_tier IN ('Professional', 'Enterprise');
    WHEN 'Enterprise' THEN RETURN user_subscription_tier = 'Enterprise';
    ELSE RETURN false;
  END CASE;
END;
$function$;

-- Fix join_academy function
CREATE OR REPLACE FUNCTION public.join_academy(academy_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update the user's profile to associate with the academy
  UPDATE profiles 
  SET academy_id = academy_uuid, 
      updated_at = now()
  WHERE id = auth.uid();
  
  -- Return true if the update was successful
  RETURN FOUND;
END;
$function$;

-- Fix update_attendance_streaks function
CREATE OR REPLACE FUNCTION public.update_attendance_streaks()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update present streak
  INSERT INTO attendance_streaks (student_id, class_id, streak_type, current_streak, longest_streak, last_updated_date)
  VALUES (NEW.student_id, NEW.class_id, 'present', 
    CASE WHEN NEW.status = 'present' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'present' THEN 1 ELSE 0 END,
    NEW.date::date)
  ON CONFLICT (student_id, class_id, streak_type)
  DO UPDATE SET
    current_streak = CASE 
      WHEN NEW.status = 'present' AND attendance_streaks.last_updated_date = NEW.date::date - INTERVAL '1 day' 
      THEN attendance_streaks.current_streak + 1
      WHEN NEW.status = 'present' THEN 1
      ELSE 0
    END,
    longest_streak = GREATEST(attendance_streaks.longest_streak, 
      CASE 
        WHEN NEW.status = 'present' AND attendance_streaks.last_updated_date = NEW.date::date - INTERVAL '1 day' 
        THEN attendance_streaks.current_streak + 1
        WHEN NEW.status = 'present' THEN 1
        ELSE attendance_streaks.longest_streak
      END),
    last_updated_date = NEW.date::date,
    updated_at = now();

  -- Update absent streak
  INSERT INTO attendance_streaks (student_id, class_id, streak_type, current_streak, longest_streak, last_updated_date)
  VALUES (NEW.student_id, NEW.class_id, 'absent', 
    CASE WHEN NEW.status = 'absent' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'absent' THEN 1 ELSE 0 END,
    NEW.date::date)
  ON CONFLICT (student_id, class_id, streak_type)
  DO UPDATE SET
    current_streak = CASE 
      WHEN NEW.status = 'absent' AND attendance_streaks.last_updated_date = NEW.date::date - INTERVAL '1 day' 
      THEN attendance_streaks.current_streak + 1
      WHEN NEW.status = 'absent' THEN 1
      ELSE 0
    END,
    longest_streak = GREATEST(attendance_streaks.longest_streak, 
      CASE 
        WHEN NEW.status = 'absent' AND attendance_streaks.last_updated_date = NEW.date::date - INTERVAL '1 day' 
        THEN attendance_streaks.current_streak + 1
        WHEN NEW.status = 'absent' THEN 1
        ELSE attendance_streaks.longest_streak
      END),
    last_updated_date = NEW.date::date,
    updated_at = now();

  RETURN NEW;
END;
$function$;