-- Attach comprehensive audit logging to public.profiles so changes flow into public.audit_logs

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'audit_logs'
  ) AND EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'log_comprehensive_audit'
  ) THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_profiles_changes ON public.profiles';
    EXECUTE 'CREATE TRIGGER audit_profiles_changes AFTER INSERT OR UPDATE OR DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.log_comprehensive_audit()';
  END IF;
END
$$;
