-- Secure profiles table with proper RLS to protect sensitive personal data
-- 1) Enable RLS and drop any existing permissive policies
DO $$
BEGIN
  -- Enable RLS (safe if already enabled)
  EXECUTE 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY';

  -- Drop all existing policies on profiles to remove permissive access
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    EXECUTE (
      SELECT string_agg(
        format('DROP POLICY IF EXISTS %I ON public.profiles;', policyname), ' '
      )
      FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'profiles'
    );
  END IF;
END$$;

-- 2) Create strict RLS policies for profiles
-- Users can read their own profile
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Academy staff (admin/owner/instructor) can view profiles within their academy
CREATE POLICY "profiles_select_academy_staff"
ON public.profiles
FOR SELECT
USING (
  get_current_user_role() = ANY (ARRAY['admin','owner','instructor'])
  AND EXISTS (
    SELECT 1
    FROM academy_memberships am1
    JOIN academy_memberships am2 ON am1.academy_id = am2.academy_id
    WHERE am1.user_id = auth.uid()
      AND am2.user_id = profiles.id
      AND am1.is_active = true
      AND am2.is_active = true
  )
);

-- Academy admins/owners can manage (insert/update/delete) profiles within their academy
CREATE POLICY "profiles_manage_academy_admin"
ON public.profiles
FOR ALL
USING (
  get_current_user_role() = ANY (ARRAY['admin','owner'])
  AND EXISTS (
    SELECT 1
    FROM academy_memberships am1
    JOIN academy_memberships am2 ON am1.academy_id = am2.academy_id
    WHERE am1.user_id = auth.uid()
      AND am2.user_id = profiles.id
      AND am1.is_active = true
      AND am2.is_active = true
  )
)
WITH CHECK (
  get_current_user_role() = ANY (ARRAY['admin','owner'])
  AND EXISTS (
    SELECT 1
    FROM academy_memberships am1
    JOIN academy_memberships am2 ON am1.academy_id = am2.academy_id
    WHERE am1.user_id = auth.uid()
      AND am2.user_id = profiles.id
      AND am1.is_active = true
      AND am2.is_active = true
  )
);

-- Users can insert their own profile (for new signups)
CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
WITH CHECK (id = auth.uid());