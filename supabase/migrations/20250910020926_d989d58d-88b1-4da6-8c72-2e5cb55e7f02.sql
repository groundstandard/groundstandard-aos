-- FINAL SECURITY LOCKDOWN: Remove all public access and enforce authentication

-- 1) Remove all public access policies from payments table
DROP POLICY IF EXISTS "payments_manage_academy_admin" ON public.payments;
DROP POLICY IF EXISTS "payments_select_own_or_staff" ON public.payments;

-- 2) Remove all public access policies from attendance table  
DROP POLICY IF EXISTS "attendance_academy_isolation" ON public.attendance;

-- 3) Remove all public access policies from profiles table
DROP POLICY IF EXISTS "profiles_manage_academy_admin" ON public.profiles;

-- 4) Fix subscribers table - add proper RLS policies
DROP POLICY IF EXISTS "subscribers_read_own" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_write_own" ON public.subscribers;

CREATE POLICY "Users can view their own subscription"
ON public.subscribers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own subscription"
ON public.subscribers
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all subscriptions"
ON public.subscribers
FOR ALL
TO authenticated
USING (public.get_current_user_role() IN ('admin','owner'))
WITH CHECK (public.get_current_user_role() IN ('admin','owner'));

-- 5) Ensure academies table only allows authenticated access
DROP POLICY IF EXISTS "Academy members view their academy" ON public.academies;
DROP POLICY IF EXISTS "Academy owners manage their academy" ON public.academies;

CREATE POLICY "Academy members can view their academy"
ON public.academies
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT academy_id FROM academy_memberships
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Academy owners can manage their academy"
ON public.academies
FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- 6) Block all unauthenticated access by default
ALTER TABLE public.payments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.attendance FORCE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.academies FORCE ROW LEVEL SECURITY;