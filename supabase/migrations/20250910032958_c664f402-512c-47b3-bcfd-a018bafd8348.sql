-- Secure membership_plans table - restrict to authenticated academy members only
DROP POLICY IF EXISTS "Users can view active membership plans" ON public.membership_plans;
CREATE POLICY "Academy members can view membership plans" ON public.membership_plans
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- Allow if user is member of any academy (for multi-academy support)
      EXISTS (
        SELECT 1 FROM academy_memberships am
        WHERE am.user_id = auth.uid() AND am.is_active = true
      )
    )
  );

-- Secure belt_progressions table - restrict to academy members only  
DROP POLICY IF EXISTS "Everyone can view belt progressions" ON public.belt_progressions;
CREATE POLICY "Academy members can view belt progressions" ON public.belt_progressions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM academy_memberships am
        WHERE am.user_id = auth.uid() AND am.is_active = true
      )
    )
  );

-- Create and secure subscription_plans table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'subscription_plans') THEN
    -- Enable RLS on subscription_plans
    ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
    
    -- Create policy for subscription_plans
    CREATE POLICY "Authenticated users can view subscription plans" ON public.subscription_plans
      FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Create and secure tax_settings table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tax_settings') THEN
    -- Enable RLS on tax_settings
    ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;
    
    -- Create policy for tax_settings - admin only
    CREATE POLICY "Academy admins can manage tax settings" ON public.tax_settings
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM academy_memberships am
          WHERE am.user_id = auth.uid() 
          AND am.is_active = true 
          AND am.role IN ('owner', 'admin')
        )
      );
  END IF;
END $$;

-- Create and secure class_schedules table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'class_schedules') THEN
    -- Enable RLS on class_schedules
    ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;
    
    -- Create policy for class_schedules - authenticated users only
    CREATE POLICY "Academy members can view class schedules" ON public.class_schedules
      FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
          EXISTS (
            SELECT 1 FROM academy_memberships am
            WHERE am.user_id = auth.uid() AND am.is_active = true
          )
        )
      );
      
    -- Allow admins to manage schedules
    CREATE POLICY "Academy admins can manage class schedules" ON public.class_schedules
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM academy_memberships am
          WHERE am.user_id = auth.uid() 
          AND am.is_active = true 
          AND am.role IN ('owner', 'admin', 'instructor')
        )
      );
  END IF;
END $$;

-- Create and secure events table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'events') THEN
    -- Enable RLS on events
    ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
    
    -- Create policy for events - authenticated users can view published events
    CREATE POLICY "Academy members can view events" ON public.events
      FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
          EXISTS (
            SELECT 1 FROM academy_memberships am
            WHERE am.user_id = auth.uid() AND am.is_active = true
          )
        )
      );
      
    -- Allow admins to manage events
    CREATE POLICY "Academy admins can manage events" ON public.events
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM academy_memberships am
          WHERE am.user_id = auth.uid() 
          AND am.is_active = true 
          AND am.role IN ('owner', 'admin')
        )
      );
  END IF;
END $$;