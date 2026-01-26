-- Fix audit_role_changes so it cannot crash when mistakenly attached to non-profiles tables

CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Safety: this trigger is only intended for public.profiles
  IF TG_TABLE_NAME <> 'profiles' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  -- Only log role changes, and only for UPDATE operations
  IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (
      auth.uid(),
      'role_change',
      'profiles',
      NEW.id,
      jsonb_build_object('role', OLD.role),
      jsonb_build_object('role', NEW.role)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Drop any wrongly-attached triggers named audit_role_changes on non-profiles tables
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT
      n.nspname AS schema_name,
      c.relname AS table_name
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE NOT t.tgisinternal
      AND t.tgname = 'audit_role_changes'
      AND n.nspname = 'public'
      AND c.relname <> 'profiles'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_role_changes ON %I.%I', r.schema_name, r.table_name);
  END LOOP;
END
$$;
