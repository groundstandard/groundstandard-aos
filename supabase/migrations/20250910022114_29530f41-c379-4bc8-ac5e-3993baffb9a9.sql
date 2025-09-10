-- Fix remaining public access issues identified in security scan

-- 1) Fix payment_transactions table (financial data exposure)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_transactions') THEN
        ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.payment_transactions FORCE ROW LEVEL SECURITY;
        
        -- Drop any existing policies
        DROP POLICY IF EXISTS "payment_transactions_public_read" ON public.payment_transactions;
        DROP POLICY IF EXISTS "select_payment_transactions" ON public.payment_transactions;
        
        -- Only admins can view payment transactions
        CREATE POLICY "Admins can manage payment transactions"
        ON public.payment_transactions
        FOR ALL
        TO authenticated
        USING (public.get_current_user_role() IN ('admin','owner'))
        WITH CHECK (public.get_current_user_role() IN ('admin','owner'));
        
        -- Users can view their own transactions
        CREATE POLICY "Users can view their own payment transactions"
        ON public.payment_transactions
        FOR SELECT
        TO authenticated
        USING (user_id = auth.uid());
    END IF;
END $$;

-- 2) Fix stripe_connected_accounts table (Stripe account exposure)
ALTER TABLE public.stripe_connected_accounts FORCE ROW LEVEL SECURITY;

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "manage_connected_accounts" ON public.stripe_connected_accounts;

-- Only allow academy owners to manage their connected accounts
CREATE POLICY "Academy owners can manage their stripe accounts"
ON public.stripe_connected_accounts
FOR ALL
TO authenticated
USING (
  academy_id IN (
    SELECT id FROM academies WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  academy_id IN (
    SELECT id FROM academies WHERE owner_id = auth.uid()
  )
);

-- 3) Ensure profiles table is properly locked down
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- Drop any remaining permissive policies
DROP POLICY IF EXISTS "profiles_manage_academy_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;

-- Create proper academy-scoped policies
CREATE POLICY "Academy members can view profiles in their academy"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM academy_memberships am1
    JOIN academy_memberships am2 ON am1.academy_id = am2.academy_id
    WHERE am1.user_id = auth.uid() 
    AND am2.user_id = profiles.id
    AND am1.is_active = true 
    AND am2.is_active = true
  )
);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can manage profiles in their academy"
ON public.profiles
FOR ALL
TO authenticated
USING (
  public.get_current_user_role() IN ('admin','owner') AND
  EXISTS (
    SELECT 1 FROM academy_memberships am1
    JOIN academy_memberships am2 ON am1.academy_id = am2.academy_id
    WHERE am1.user_id = auth.uid() 
    AND am2.user_id = profiles.id
    AND am1.is_active = true 
    AND am2.is_active = true
  )
)
WITH CHECK (
  public.get_current_user_role() IN ('admin','owner') AND
  EXISTS (
    SELECT 1 FROM academy_memberships am1
    JOIN academy_memberships am2 ON am1.academy_id = am2.academy_id
    WHERE am1.user_id = auth.uid() 
    AND am2.user_id = profiles.id
    AND am1.is_active = true 
    AND am2.is_active = true
  )
);

-- 4) Ensure subscribers table is properly locked down (already has some policies but force RLS)
ALTER TABLE public.subscribers FORCE ROW LEVEL SECURITY;

-- 5) Ensure academies table is properly locked down  
ALTER TABLE public.academies FORCE ROW LEVEL SECURITY;