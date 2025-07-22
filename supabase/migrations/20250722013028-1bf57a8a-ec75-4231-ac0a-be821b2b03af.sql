-- Final fix for infinite recursion - completely isolate profiles table
-- The issue is that even security definer functions can trigger recursion

-- Drop all existing problematic policies
DROP POLICY IF EXISTS "profiles_select_safe" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_safe" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

-- Create ultra-simple policies that don't reference other tables
CREATE POLICY "profiles_select_simple" 
ON public.profiles FOR SELECT 
USING (
    -- Users can always see their own profile
    auth.uid() = id 
    OR
    -- Allow system functions to read profiles by using a simple role check
    current_setting('role') = 'supabase_admin'
);

CREATE POLICY "profiles_update_simple" 
ON public.profiles FOR UPDATE 
USING (
    -- Users can update their own profile
    auth.uid() = id 
    OR
    -- Allow system admin access
    current_setting('role') = 'supabase_admin'
);

CREATE POLICY "profiles_insert_simple" 
ON public.profiles FOR INSERT 
WITH CHECK (
    -- Users can only insert their own profile
    auth.uid() = id
    OR
    -- Allow system admin access
    current_setting('role') = 'supabase_admin'
);

-- For academy isolation, we'll handle this at the application level for now
-- and add proper academy-based RLS later after the basic flow works

-- Create a temporary function to check if setup is working
CREATE OR REPLACE FUNCTION public.test_profile_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid()
    );
$$;