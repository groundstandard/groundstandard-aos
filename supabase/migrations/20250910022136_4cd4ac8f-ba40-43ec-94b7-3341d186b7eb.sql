-- Simple RLS enforcement for remaining public tables

-- 1) Fix payment_transactions table (admin-only access)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_transactions') THEN
        ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.payment_transactions FORCE ROW LEVEL SECURITY;
        
        -- Drop any existing permissive policies
        DROP POLICY IF EXISTS "payment_transactions_public_read" ON public.payment_transactions;
        DROP POLICY IF EXISTS "select_payment_transactions" ON public.payment_transactions;
        
        -- Only admins can access payment transactions
        CREATE POLICY "Admins only can manage payment transactions"
        ON public.payment_transactions
        FOR ALL
        TO authenticated
        USING (public.get_current_user_role() IN ('admin','owner'))
        WITH CHECK (public.get_current_user_role() IN ('admin','owner'));
    END IF;
END $$;

-- 2) Fix stripe_connected_accounts table
ALTER TABLE public.stripe_connected_accounts FORCE ROW LEVEL SECURITY;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "manage_connected_accounts" ON public.stripe_connected_accounts;

-- 3) Ensure profiles table is properly locked down
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- Drop any remaining permissive policies
DROP POLICY IF EXISTS "profiles_manage_academy_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;

-- Only authenticated users can view profiles (basic protection)
CREATE POLICY "Authenticated users only can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.get_current_user_role() IN ('admin','owner'))
WITH CHECK (public.get_current_user_role() IN ('admin','owner'));

-- 4) Ensure subscribers table is properly locked down
ALTER TABLE public.subscribers FORCE ROW LEVEL SECURITY;

-- 5) Ensure academies table is properly locked down  
ALTER TABLE public.academies FORCE ROW LEVEL SECURITY;