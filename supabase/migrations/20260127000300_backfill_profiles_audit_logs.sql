ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

CREATE OR REPLACE FUNCTION public.log_profiles_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_action text;
  v_profile_id uuid;
BEGIN
  v_action := CASE TG_OP
    WHEN 'INSERT' THEN 'create'
    WHEN 'UPDATE' THEN 'update'
    WHEN 'DELETE' THEN 'delete'
    ELSE lower(TG_OP)
  END;
  v_profile_id := COALESCE(NEW.id, OLD.id);

  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    v_profile_id,
    v_action,
    TG_TABLE_NAME,
    v_profile_id,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW) WHEN TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
  ) THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_profiles_changes ON public.profiles';
    EXECUTE 'CREATE TRIGGER audit_profiles_changes AFTER INSERT OR UPDATE OR DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.log_profiles_audit()';
  END IF;
END
$$;

INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values, created_at)
SELECT
  p.id,
  'create',
  'profiles',
  p.id,
  NULL,
  to_jsonb(p),
  COALESCE(p.created_at, now())
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1
  FROM public.audit_logs al
  WHERE al.table_name = 'profiles'
    AND al.action = 'create'
    AND al.record_id = p.id
);
