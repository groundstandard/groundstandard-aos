-- Continue fixing database function security warnings - Part 2

-- Fix process_class_pack_attendance function
CREATE OR REPLACE FUNCTION public.process_class_pack_attendance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    active_pack RECORD;
BEGIN
    -- Only process for 'present' attendance
    IF NEW.status = 'present' THEN
        -- Find the most recent active class pack for this student
        SELECT * INTO active_pack
        FROM class_packs
        WHERE profile_id = NEW.student_id
        AND status = 'active'
        AND remaining_classes > 0
        AND expiry_date >= CURRENT_DATE
        ORDER BY purchase_date ASC
        LIMIT 1;
        
        IF active_pack.id IS NOT NULL THEN
            -- Decrement remaining classes
            UPDATE class_packs
            SET remaining_classes = remaining_classes - 1,
                status = CASE 
                    WHEN remaining_classes - 1 <= 0 THEN 'exhausted'
                    ELSE 'active'
                END,
                updated_at = now()
            WHERE id = active_pack.id;
            
            -- Record the usage
            INSERT INTO class_pack_usage (class_pack_id, attendance_id, used_date)
            VALUES (active_pack.id, NEW.id, NEW.date);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Fix update_thread_count function
CREATE OR REPLACE FUNCTION public.update_thread_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.parent_message_id IS NOT NULL THEN
    UPDATE chat_messages 
    SET thread_count = (
      SELECT COUNT(*) 
      FROM chat_messages 
      WHERE parent_message_id = NEW.parent_message_id
    )
    WHERE id = NEW.parent_message_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix get_or_create_dm_channel function
CREATE OR REPLACE FUNCTION public.get_or_create_dm_channel(other_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  channel_id UUID;
  current_user_id UUID := auth.uid();
BEGIN
  -- Ensure user1_id is always the smaller UUID for consistency
  SELECT id INTO channel_id
  FROM direct_message_channels
  WHERE (user1_id = LEAST(current_user_id, other_user_id) AND user2_id = GREATEST(current_user_id, other_user_id));
  
  IF channel_id IS NULL THEN
    INSERT INTO direct_message_channels (user1_id, user2_id)
    VALUES (LEAST(current_user_id, other_user_id), GREATEST(current_user_id, other_user_id))
    RETURNING id INTO channel_id;
  END IF;
  
  RETURN channel_id;
END;
$function$;

-- Fix get_academy_usage function
CREATE OR REPLACE FUNCTION public.get_academy_usage(academy_uuid uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'students', (
      SELECT COUNT(*) 
      FROM profiles 
      WHERE academy_id = academy_uuid 
      AND role = 'student'
    ),
    'instructors', (
      SELECT COUNT(*) 
      FROM profiles 
      WHERE academy_id = academy_uuid 
      AND role IN ('instructor', 'admin', 'owner')
    ),
    'active_classes', (
      SELECT COUNT(*) 
      FROM classes 
      WHERE is_active = true
    )
  );
$function$;

-- Fix create_academy_subscription function
CREATE OR REPLACE FUNCTION public.create_academy_subscription()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO academy_subscriptions (
    academy_id, 
    plan_type, 
    status, 
    trial_ends_at,
    max_students,
    max_instructors
  ) VALUES (
    NEW.id,
    'starter',
    'trial',
    now() + INTERVAL '30 days',
    50,
    3
  );
  RETURN NEW;
END;
$function$;