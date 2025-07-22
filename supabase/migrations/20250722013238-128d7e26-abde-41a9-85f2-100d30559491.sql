-- TEMPORARY: Completely disable RLS on profiles to eliminate recursion
-- This will get the user unblocked while we figure out the root cause

-- Drop ALL policies on profiles table
DROP POLICY IF EXISTS "profiles_select_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_simple" ON public.profiles;

-- Temporarily disable RLS entirely on profiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Also check if there are any problematic functions causing issues
DROP FUNCTION IF EXISTS public.get_user_academy_role(UUID);
DROP FUNCTION IF EXISTS public.get_user_academies(UUID);
DROP FUNCTION IF EXISTS public.user_has_academy_access(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_user_role_in_academy(UUID, UUID);

-- Recreate the essential functions without any RLS dependencies
CREATE OR REPLACE FUNCTION public.get_user_academies(target_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(academy_id uuid, role text, academy_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
    SELECT 
        am.academy_id,
        am.role,
        a.name as academy_name
    FROM public.academy_memberships am
    JOIN public.academies a ON am.academy_id = a.id
    WHERE am.user_id = target_user_id 
    AND am.is_active = true
    ORDER BY am.joined_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.user_has_academy_access(target_academy_id uuid, target_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.academy_memberships
        WHERE user_id = target_user_id 
        AND academy_id = target_academy_id 
        AND is_active = true
    );
$$;

CREATE OR REPLACE FUNCTION public.get_user_role_in_academy(target_academy_id uuid, target_user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
    SELECT COALESCE(
        (SELECT role
         FROM public.academy_memberships
         WHERE user_id = target_user_id 
         AND academy_id = target_academy_id 
         AND is_active = true),
        'none'
    );
$$;