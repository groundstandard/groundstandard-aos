-- Final security hardening: Fix newly detected exposed business data tables

-- Fix payment_plans public access
DROP POLICY IF EXISTS "Authenticated users can view payment plans" ON public.payment_plans;
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Academy members can view payment plans" 
    ON public.payment_plans 
    FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM academy_memberships am
        WHERE am.user_id = auth.uid() AND am.is_active = true
      )
    );
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Fix private_sessions public access
DROP POLICY IF EXISTS "Users can view active private sessions" ON public.private_sessions;
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Academy members can view private sessions" 
    ON public.private_sessions 
    FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM academy_memberships am
        WHERE am.user_id = auth.uid() AND am.is_active = true
      )
    );
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Fix drop_in_options if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'drop_in_options') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view drop in options" ON public.drop_in_options';
    EXECUTE 'DROP POLICY IF EXISTS "Everyone can view drop in options" ON public.drop_in_options';
    
    BEGIN
      EXECUTE 'CREATE POLICY "Academy members can view drop in options" 
      ON public.drop_in_options 
      FOR SELECT 
      USING (
        EXISTS (
          SELECT 1 FROM academy_memberships am
          WHERE am.user_id = auth.uid() AND am.is_active = true
        )
      )';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;