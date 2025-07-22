-- Check what policies exist on profiles table and fix recursion issues completely
-- First, let's see all current policies on profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Drop ALL existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin access to all profiles" ON public.profiles;

-- Completely replace the get_current_user_role function to avoid any recursion
DROP FUNCTION IF EXISTS public.get_current_user_role();

-- Create a simple, safe function that doesn't use RLS
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    -- Direct query bypassing RLS entirely
    SELECT role INTO result FROM public.profiles WHERE id = user_id;
    RETURN COALESCE(result, 'student');
EXCEPTION 
    WHEN OTHERS THEN
        RETURN 'student';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create simple, non-recursive policies
CREATE POLICY "profiles_select_own" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow system/admin operations without recursive checks
CREATE POLICY "profiles_admin_all" 
ON public.profiles FOR ALL 
USING (
    -- Check if user is owner of any academy (bypass role check)
    EXISTS (
        SELECT 1 FROM public.academies 
        WHERE owner_id = auth.uid()
    )
    OR
    -- Allow if it's the user's own profile
    auth.uid() = id
);