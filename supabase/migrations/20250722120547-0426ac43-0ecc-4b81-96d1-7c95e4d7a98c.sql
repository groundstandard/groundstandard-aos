-- Fix data isolation by re-enabling RLS and creating proper academy isolation policies

-- Re-enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "profiles_select_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_simple" ON public.profiles;

-- Create academy-based RLS policies for profiles
CREATE POLICY "profiles_academy_isolation_select"
ON public.profiles FOR SELECT
USING (
  -- Users can see their own profile
  auth.uid() = id 
  OR 
  -- Users can see profiles in their academy
  academy_id IN (
    SELECT academy_id 
    FROM public.academy_memberships 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "profiles_academy_isolation_insert"
ON public.profiles FOR INSERT
WITH CHECK (
  -- Users can only insert profiles for their own academy
  academy_id IN (
    SELECT academy_id 
    FROM public.academy_memberships 
    WHERE user_id = auth.uid() 
    AND is_active = true
    AND role IN ('owner', 'admin', 'instructor')
  )
  OR auth.uid() = id  -- Allow users to create their own profile
);

CREATE POLICY "profiles_academy_isolation_update"
ON public.profiles FOR UPDATE
USING (
  -- Users can update their own profile
  auth.uid() = id 
  OR 
  -- Academy admins can update profiles in their academy
  (
    academy_id IN (
      SELECT academy_id 
      FROM public.academy_memberships 
      WHERE user_id = auth.uid() 
      AND is_active = true
      AND role IN ('owner', 'admin')
    )
  )
);

CREATE POLICY "profiles_academy_isolation_delete"
ON public.profiles FOR DELETE
USING (
  -- Only academy owners can delete profiles in their academy
  academy_id IN (
    SELECT academy_id 
    FROM public.academy_memberships 
    WHERE user_id = auth.uid() 
    AND is_active = true
    AND role = 'owner'
  )
);