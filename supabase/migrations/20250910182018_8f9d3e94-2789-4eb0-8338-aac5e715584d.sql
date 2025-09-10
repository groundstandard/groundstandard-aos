-- Security hardening: Remove overly permissive RLS policies that expose business data publicly

-- Remove public access policies from class_schedules
DROP POLICY IF EXISTS "Everyone can view class schedules" ON public.class_schedules;

-- Remove public access policies from events (keep only published events accessible to authenticated users)
DROP POLICY IF EXISTS "Everyone can view published events" ON public.events;

-- Add more restrictive policy for events - only authenticated users can view published events
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Authenticated users can view published events" 
    ON public.events 
    FOR SELECT 
    USING (
      auth.uid() IS NOT NULL 
      AND status IN ('published', 'registration_open', 'registration_closed', 'completed')
    );
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Remove public access policies from subscription_plans
DROP POLICY IF EXISTS "Everyone can view subscription plans" ON public.subscription_plans;

-- Update subscription_plans policy to require authentication
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Authenticated users can view active subscription plans" 
    ON public.subscription_plans 
    FOR SELECT 
    USING (auth.uid() IS NOT NULL AND is_active = true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Remove public access policies from tax_settings
DROP POLICY IF EXISTS "Users can view active tax settings" ON public.tax_settings;

-- Since tax_settings doesn't have academy_id, restrict to authenticated users only
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Authenticated users can view active tax settings" 
    ON public.tax_settings 
    FOR SELECT 
    USING (auth.uid() IS NOT NULL AND is_active = true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;