-- Expand audit logging coverage so audit_logs captures most user transactions

-- 1) Update comprehensive audit function to ALSO write into public.audit_logs (used by the UI)
CREATE OR REPLACE FUNCTION public.log_comprehensive_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  record_name TEXT;
  effective_action TEXT;
  record_uuid UUID;
BEGIN
  -- Determine human-readable identifier + record id
  record_uuid := COALESCE(NEW.id, OLD.id);

  CASE TG_TABLE_NAME
    WHEN 'profiles' THEN
      record_name := COALESCE(
        NULLIF(TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '')), ''),
        NULLIF(TRIM(COALESCE(OLD.first_name, '') || ' ' || COALESCE(OLD.last_name, '')), ''),
        COALESCE(NEW.email, OLD.email),
        record_uuid::text
      );
    WHEN 'classes' THEN
      record_name := COALESCE(NEW.name, OLD.name, record_uuid::text);
    WHEN 'class_schedules' THEN
      record_name := 'Schedule for class';
    WHEN 'events' THEN
      record_name := COALESCE(NEW.title, OLD.title, record_uuid::text);
    WHEN 'payments' THEN
      record_name := COALESCE(NEW.description, OLD.description, record_uuid::text);
    WHEN 'student_belt_history' THEN
      record_name := COALESCE(NEW.belt_level, OLD.belt_level, record_uuid::text);
    WHEN 'belt_tests' THEN
      record_name := COALESCE(NEW.target_belt, OLD.target_belt, record_uuid::text);
    WHEN 'academy_memberships' THEN
      record_name := COALESCE(NEW.user_id::text, OLD.user_id::text, record_uuid::text);
    WHEN 'academy_switches' THEN
      record_name := 'Academy switch';
    WHEN 'membership_subscriptions' THEN
      record_name := COALESCE(NEW.user_id::text, OLD.user_id::text, record_uuid::text);
    WHEN 'class_reservations' THEN
      record_name := COALESCE(NEW.student_id::text, OLD.student_id::text, record_uuid::text);
    ELSE
      record_name := COALESCE(record_uuid::text);
  END CASE;

  -- Determine action label (keep UI dropdown compatible)
  IF TG_TABLE_NAME = 'profiles' AND TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    effective_action := 'role_change';
  ELSE
    effective_action := CASE TG_OP
      WHEN 'INSERT' THEN 'create'
      WHEN 'UPDATE' THEN 'update'
      WHEN 'DELETE' THEN 'delete'
      ELSE LOWER(TG_OP)
    END;
  END IF;

  -- Write into comprehensive table
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs_comprehensive (
      user_id, action, table_name, record_id, record_identifier,
      old_values, module_name
    ) VALUES (
      auth.uid(), effective_action, TG_TABLE_NAME, OLD.id, record_name,
      to_jsonb(OLD),
      CASE TG_TABLE_NAME
        WHEN 'class_schedules' THEN 'schedules'
        WHEN 'classes' THEN 'schedules'
        WHEN 'profiles' THEN 'students'
        WHEN 'attendance' THEN 'attendance'
        WHEN 'payments' THEN 'payments'
        WHEN 'events' THEN 'events'
        ELSE 'system'
      END
    );

    -- Write into simple table (UI source)
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values)
    VALUES (auth.uid(), effective_action, TG_TABLE_NAME, OLD.id, to_jsonb(OLD));

    RETURN OLD;

  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs_comprehensive (
      user_id, action, table_name, record_id, record_identifier,
      old_values, new_values, module_name
    ) VALUES (
      auth.uid(), effective_action, TG_TABLE_NAME, NEW.id, record_name,
      to_jsonb(OLD), to_jsonb(NEW),
      CASE TG_TABLE_NAME
        WHEN 'class_schedules' THEN 'schedules'
        WHEN 'classes' THEN 'schedules'
        WHEN 'profiles' THEN 'students'
        WHEN 'attendance' THEN 'attendance'
        WHEN 'payments' THEN 'payments'
        WHEN 'events' THEN 'events'
        ELSE 'system'
      END
    );

    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), effective_action, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));

    RETURN NEW;

  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs_comprehensive (
      user_id, action, table_name, record_id, record_identifier,
      new_values, module_name
    ) VALUES (
      auth.uid(), effective_action, TG_TABLE_NAME, NEW.id, record_name,
      to_jsonb(NEW),
      CASE TG_TABLE_NAME
        WHEN 'class_schedules' THEN 'schedules'
        WHEN 'classes' THEN 'schedules'
        WHEN 'profiles' THEN 'students'
        WHEN 'attendance' THEN 'attendance'
        WHEN 'payments' THEN 'payments'
        WHEN 'events' THEN 'events'
        ELSE 'system'
      END
    );

    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (auth.uid(), effective_action, TG_TABLE_NAME, NEW.id, to_jsonb(NEW));

    RETURN NEW;
  END IF;

  RETURN NULL;
END
$$;

-- 1b) Prevent duplicate role_change rows (profiles already uses log_comprehensive_audit)
DROP TRIGGER IF EXISTS audit_profile_role_changes ON public.profiles;

-- 2) Add triggers for additional tables (guarded so migration won't fail if table doesn't exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_payments_changes ON public.payments';
    EXECUTE 'CREATE TRIGGER audit_payments_changes AFTER INSERT OR UPDATE OR DELETE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.log_comprehensive_audit()';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_events_changes ON public.events';
    EXECUTE 'CREATE TRIGGER audit_events_changes AFTER INSERT OR UPDATE OR DELETE ON public.events FOR EACH ROW EXECUTE FUNCTION public.log_comprehensive_audit()';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_registrations') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_event_registrations_changes ON public.event_registrations';
    EXECUTE 'CREATE TRIGGER audit_event_registrations_changes AFTER INSERT OR UPDATE OR DELETE ON public.event_registrations FOR EACH ROW EXECUTE FUNCTION public.log_comprehensive_audit()';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'belt_tests') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_belt_tests_changes ON public.belt_tests';
    EXECUTE 'CREATE TRIGGER audit_belt_tests_changes AFTER INSERT OR UPDATE OR DELETE ON public.belt_tests FOR EACH ROW EXECUTE FUNCTION public.log_comprehensive_audit()';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_belt_history') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_student_belt_history_changes ON public.student_belt_history';
    EXECUTE 'CREATE TRIGGER audit_student_belt_history_changes AFTER INSERT OR UPDATE OR DELETE ON public.student_belt_history FOR EACH ROW EXECUTE FUNCTION public.log_comprehensive_audit()';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'academy_memberships') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_academy_memberships_changes ON public.academy_memberships';
    EXECUTE 'CREATE TRIGGER audit_academy_memberships_changes AFTER INSERT OR UPDATE OR DELETE ON public.academy_memberships FOR EACH ROW EXECUTE FUNCTION public.log_comprehensive_audit()';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'academy_switches') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_academy_switches_changes ON public.academy_switches';
    EXECUTE 'CREATE TRIGGER audit_academy_switches_changes AFTER INSERT OR UPDATE OR DELETE ON public.academy_switches FOR EACH ROW EXECUTE FUNCTION public.log_comprehensive_audit()';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'membership_subscriptions') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_membership_subscriptions_changes ON public.membership_subscriptions';
    EXECUTE 'CREATE TRIGGER audit_membership_subscriptions_changes AFTER INSERT OR UPDATE OR DELETE ON public.membership_subscriptions FOR EACH ROW EXECUTE FUNCTION public.log_comprehensive_audit()';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'class_reservations') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_class_reservations_changes ON public.class_reservations';
    EXECUTE 'CREATE TRIGGER audit_class_reservations_changes AFTER INSERT OR UPDATE OR DELETE ON public.class_reservations FOR EACH ROW EXECUTE FUNCTION public.log_comprehensive_audit()';
  END IF;
END
$$;
