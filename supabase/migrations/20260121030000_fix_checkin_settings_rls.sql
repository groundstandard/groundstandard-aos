-- Fix check_in_settings RLS policy to allow authenticated users to read settings
-- The current policy is too restrictive and blocking access

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Admins and owners can manage check-in settings" ON public.check_in_settings;

-- Create more permissive policies
-- Allow all authenticated users to read check-in settings (needed for the app to work)
CREATE POLICY "Authenticated users can read check-in settings"
ON public.check_in_settings
FOR SELECT
TO authenticated
USING (true);

-- Only admins/owners can modify settings
CREATE POLICY "Admins and owners can modify check-in settings"
ON public.check_in_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- Ensure there's at least one settings row (in case the previous insert didn't work)
INSERT INTO public.check_in_settings (
  kiosk_mode_enabled, 
  auto_checkout_hours, 
  require_class_selection, 
  welcome_message
)
SELECT 
  false, 
  24, 
  true, 
  'Welcome! Please enter your 4-digit PIN to check in.'
WHERE NOT EXISTS (SELECT 1 FROM public.check_in_settings);
