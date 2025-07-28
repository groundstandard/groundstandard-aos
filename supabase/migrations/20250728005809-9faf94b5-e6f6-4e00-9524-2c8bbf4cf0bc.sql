-- Phase 1: Fix all database function security warnings by adding SET search_path TO 'public'
-- This prevents SQL injection attacks through search_path manipulation

-- Fix update_calendar_events_updated_at function
CREATE OR REPLACE FUNCTION public.update_calendar_events_updated_at()
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

-- Fix sync_membership_plan_prices function
CREATE OR REPLACE FUNCTION public.sync_membership_plan_prices()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Keep price_cents in sync with base_price_cents
  NEW.price_cents = NEW.base_price_cents;
  RETURN NEW;
END;
$function$;

-- Fix check_subscription_limits function
CREATE OR REPLACE FUNCTION public.check_subscription_limits(academy_uuid uuid, limit_type text)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    CASE 
      WHEN limit_type = 'students' THEN COALESCE(max_students, 50)
      WHEN limit_type = 'instructors' THEN COALESCE(max_instructors, 3)
      ELSE 0
    END
  FROM academy_subscriptions 
  WHERE academy_id = academy_uuid;
$function$;

-- Fix get_user_academies_by_role function
CREATE OR REPLACE FUNCTION public.get_user_academies_by_role(target_user_id uuid DEFAULT auth.uid(), role_filter text DEFAULT NULL::text)
 RETURNS TABLE(academy_id uuid, role text, academy_name text, city text, state text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    AND (role_filter IS NULL OR am.role = role_filter)
    ORDER BY am.joined_at DESC;
$function$;

-- Fix check_absent_members function
CREATE OR REPLACE FUNCTION public.check_absent_members()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  absent_threshold INTEGER;
  absent_member RECORD;
BEGIN
  -- Get the absent days threshold from settings
  SELECT absent_days_threshold INTO absent_threshold
  FROM automation_settings
  LIMIT 1;

  IF absent_threshold IS NULL THEN
    absent_threshold := 7; -- Default to 7 days
  END IF;

  -- Find members who haven't attended in the threshold period
  FOR absent_member IN
    SELECT DISTINCT 
      p.id,
      p.first_name,
      p.last_name,
      p.email,
      MAX(a.date) as last_attendance,
      CURRENT_DATE - MAX(a.date) as days_absent
    FROM profiles p
    LEFT JOIN attendance a ON p.id = a.student_id
    WHERE p.membership_status = 'active'
    GROUP BY p.id, p.first_name, p.last_name, p.email
    HAVING (CURRENT_DATE - MAX(a.date)) >= absent_threshold
       OR MAX(a.date) IS NULL
  LOOP
    -- Call automation for each absent member
    PERFORM net.http_post(
      url := 'https://yhriiykdnpuutzexjdee.supabase.co/functions/v1/highlevel-automation',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'type', 'member_absent',
        'contactId', absent_member.id,
        'data', jsonb_build_object(
          'lastAttendance', absent_member.last_attendance,
          'daysAbsent', absent_member.days_absent
        )
      )
    );
  END LOOP;
END;
$function$;