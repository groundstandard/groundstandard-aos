-- Fix infinite recursion in profiles RLS policies
-- The issue is circular dependency between profiles and academy_memberships

-- First, create a security definer function to safely check academy access
CREATE OR REPLACE FUNCTION public.get_user_academy_role(target_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(academy_id UUID, role TEXT)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
    -- Disable RLS temporarily to avoid recursion
    PERFORM set_config('row_security', 'off', true);
    
    RETURN QUERY
    SELECT am.academy_id, am.role
    FROM public.academy_memberships am
    WHERE am.user_id = target_user_id 
    AND am.is_active = true;
    
    -- Re-enable RLS
    PERFORM set_config('row_security', 'on', true);
EXCEPTION
    WHEN OTHERS THEN
        PERFORM set_config('row_security', 'on', true);
        RETURN;
END;
$$;

-- Now update profiles policies to use this safe function
DROP POLICY IF EXISTS "profiles_select_multi_academy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_multi_academy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

CREATE POLICY "profiles_select_safe" 
ON public.profiles FOR SELECT 
USING (
    -- Users can see their own profile
    auth.uid() = id 
    OR 
    -- Users can see profiles of people in their academies
    EXISTS (
        SELECT 1 FROM public.get_user_academy_role() my_academies
        WHERE my_academies.academy_id IN (
            SELECT ur.academy_id FROM public.get_user_academy_role(profiles.id) ur
        )
    )
);

CREATE POLICY "profiles_update_safe" 
ON public.profiles FOR UPDATE 
USING (
    -- Users can update their own profile
    auth.uid() = id 
    OR 
    -- Academy owners/admins can update profiles in their academy
    EXISTS (
        SELECT 1 FROM public.get_user_academy_role() my_academies
        WHERE my_academies.role IN ('owner', 'admin')
        AND my_academies.academy_id IN (
            SELECT ur.academy_id FROM public.get_user_academy_role(profiles.id) ur
        )
    )
);

CREATE POLICY "profiles_insert_own" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);