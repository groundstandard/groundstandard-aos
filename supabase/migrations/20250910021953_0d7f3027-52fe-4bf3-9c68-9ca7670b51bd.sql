-- Lock down remaining public tables with proper RLS policies (corrected)

-- 1) Fix membership_plans table
ALTER TABLE public.membership_plans FORCE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure clean state
DROP POLICY IF EXISTS "Users can view active membership plans" ON public.membership_plans;
DROP POLICY IF EXISTS "Admins and owners can manage membership plans" ON public.membership_plans;
DROP POLICY IF EXISTS "Authenticated users can view active plans" ON public.membership_plans;
DROP POLICY IF EXISTS "Admins can manage membership plans" ON public.membership_plans;

CREATE POLICY "Authenticated users can view active plans"
ON public.membership_plans
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage membership plans"
ON public.membership_plans
FOR ALL
TO authenticated
USING (public.get_current_user_role() IN ('admin','owner'))
WITH CHECK (public.get_current_user_role() IN ('admin','owner'));

-- 2) Fix subscription_plans table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans') THEN
        ALTER TABLE public.subscription_plans FORCE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "select_active_subscription_plans" ON public.subscription_plans;
        DROP POLICY IF EXISTS "manage_subscription_plans" ON public.subscription_plans;
        DROP POLICY IF EXISTS "Authenticated users can view active subscription plans" ON public.subscription_plans;
        DROP POLICY IF EXISTS "Admins can manage subscription plans" ON public.subscription_plans;

        CREATE POLICY "Authenticated users can view active subscription plans"
        ON public.subscription_plans
        FOR SELECT
        TO authenticated
        USING (is_active = true);

        CREATE POLICY "Admins can manage subscription plans"
        ON public.subscription_plans
        FOR ALL
        TO authenticated
        USING (public.get_current_user_role() IN ('admin','owner'))
        WITH CHECK (public.get_current_user_role() IN ('admin','owner'));
    END IF;
END $$;

-- 3) Fix belt_progressions table
ALTER TABLE public.belt_progressions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view belt progressions" ON public.belt_progressions;
DROP POLICY IF EXISTS "Admins can manage belt progressions" ON public.belt_progressions;
DROP POLICY IF EXISTS "Authenticated users can view active belt progressions" ON public.belt_progressions;

CREATE POLICY "Authenticated users can view active belt progressions"
ON public.belt_progressions
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage belt progressions"
ON public.belt_progressions
FOR ALL
TO authenticated
USING (public.get_current_user_role() IN ('admin','owner'))
WITH CHECK (public.get_current_user_role() IN ('admin','owner'));

-- 4) Fix class_schedules table
ALTER TABLE public.class_schedules FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "class_schedules_academy_isolation" ON public.class_schedules;
DROP POLICY IF EXISTS "Academy members can view class schedules" ON public.class_schedules;
DROP POLICY IF EXISTS "Admins can manage class schedules" ON public.class_schedules;

CREATE POLICY "Academy members can view class schedules"
ON public.class_schedules
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM classes c
    JOIN academy_memberships am ON am.academy_id = c.academy_id
    WHERE c.id = class_schedules.class_id
    AND am.user_id = auth.uid()
    AND am.is_active = true
  )
);

CREATE POLICY "Admins can manage class schedules"
ON public.class_schedules
FOR ALL
TO authenticated
USING (public.get_current_user_role() IN ('admin','owner'))
WITH CHECK (public.get_current_user_role() IN ('admin','owner'));

-- 5) Fix tax_settings table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tax_settings') THEN
        ALTER TABLE public.tax_settings FORCE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Admins can manage tax settings" ON public.tax_settings;
        DROP POLICY IF EXISTS "Users can view tax settings" ON public.tax_settings;
        DROP POLICY IF EXISTS "Authenticated users can view active tax settings" ON public.tax_settings;

        CREATE POLICY "Authenticated users can view active tax settings"
        ON public.tax_settings
        FOR SELECT
        TO authenticated
        USING (is_active = true);

        CREATE POLICY "Admins can manage tax settings"
        ON public.tax_settings
        FOR ALL
        TO authenticated
        USING (public.get_current_user_role() IN ('admin','owner'))
        WITH CHECK (public.get_current_user_role() IN ('admin','owner'));
    END IF;
END $$;

-- 6) Fix events table  
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
        ALTER TABLE public.events FORCE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Academy members can view events" ON public.events;
        DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
        DROP POLICY IF EXISTS "Academy members can view active events" ON public.events;

        CREATE POLICY "Academy members can view active events"
        ON public.events
        FOR SELECT
        TO authenticated
        USING (
          status = 'active' AND
          academy_id IN (
            SELECT academy_id FROM academy_memberships
            WHERE user_id = auth.uid() AND is_active = true
          )
        );

        CREATE POLICY "Admins can manage events"
        ON public.events
        FOR ALL
        TO authenticated
        USING (
          public.get_current_user_role() IN ('admin','owner') AND
          academy_id IN (
            SELECT academy_id FROM academy_memberships
            WHERE user_id = auth.uid() AND is_active = true
          )
        )
        WITH CHECK (
          public.get_current_user_role() IN ('admin','owner') AND
          academy_id IN (
            SELECT academy_id FROM academy_memberships
            WHERE user_id = auth.uid() AND is_active = true
          )
        );
    END IF;
END $$;