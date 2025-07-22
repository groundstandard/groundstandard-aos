-- COMPLETE CLEANUP OF PROFILES RLS POLICIES
-- Drop ALL existing problematic policies on profiles table
DROP POLICY IF EXISTS "profiles_academy_isolation_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_academy_isolation_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_academy_isolation_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_academy_isolation_delete" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable admin read access" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles using function" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create simple, non-recursive RLS policies for profiles
-- Policy 1: Users can always view, insert, and update their own profile
CREATE POLICY "own_profile_access" 
ON public.profiles 
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 2: Allow system to insert profiles during user creation
CREATE POLICY "system_profile_insert"
ON public.profiles
FOR INSERT
WITH CHECK (true);

-- Policy 3: Simple admin access without function calls to avoid recursion
-- This uses a direct subquery which is safe since it doesn't reference the same table
CREATE POLICY "admin_profile_access"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM auth.users u
    WHERE u.id = auth.uid() 
    AND u.raw_user_meta_data->>'role' IN ('admin', 'owner')
  )
);