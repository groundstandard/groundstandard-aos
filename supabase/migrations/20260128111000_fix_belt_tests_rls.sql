-- Fix RLS for belt_tests to allow admin/owner inserts/updates while preserving academy isolation

-- Remove older policies
DROP POLICY IF EXISTS "Admins can manage all belt tests" ON public.belt_tests;
DROP POLICY IF EXISTS "Admins and owners can manage all belt tests" ON public.belt_tests;
DROP POLICY IF EXISTS "Admins and owners can manage all belt tests" ON public.belt_tests;
DROP POLICY IF EXISTS "Students can view their own belt tests" ON public.belt_tests;
DROP POLICY IF EXISTS "belt_tests_academy_isolation" ON public.belt_tests;

-- Read access: student can see their own; academy members can see students in same academy
CREATE POLICY "belt_tests_select_academy_isolation"
ON public.belt_tests
FOR SELECT
USING (
  auth.uid() = student_id
  OR EXISTS (
    SELECT 1
    FROM public.academy_memberships am1
    JOIN public.academy_memberships am2 ON am1.academy_id = am2.academy_id
    WHERE am1.user_id = auth.uid()
      AND am2.user_id = belt_tests.student_id
      AND am1.is_active = true
      AND am2.is_active = true
  )
);

-- Admin/Owner write access (INSERT)
CREATE POLICY "belt_tests_insert_admin_owner"
ON public.belt_tests
FOR INSERT
WITH CHECK (
  get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text])
  AND EXISTS (
    SELECT 1
    FROM public.academy_memberships am1
    JOIN public.academy_memberships am2 ON am1.academy_id = am2.academy_id
    WHERE am1.user_id = auth.uid()
      AND am2.user_id = belt_tests.student_id
      AND am1.role IN ('admin', 'owner')
      AND am1.is_active = true
      AND am2.is_active = true
  )
);

-- Admin/Owner write access (UPDATE)
CREATE POLICY "belt_tests_update_admin_owner"
ON public.belt_tests
FOR UPDATE
USING (
  get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text])
  AND EXISTS (
    SELECT 1
    FROM public.academy_memberships am1
    JOIN public.academy_memberships am2 ON am1.academy_id = am2.academy_id
    WHERE am1.user_id = auth.uid()
      AND am2.user_id = belt_tests.student_id
      AND am1.role IN ('admin', 'owner')
      AND am1.is_active = true
      AND am2.is_active = true
  )
)
WITH CHECK (
  get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text])
  AND EXISTS (
    SELECT 1
    FROM public.academy_memberships am1
    JOIN public.academy_memberships am2 ON am1.academy_id = am2.academy_id
    WHERE am1.user_id = auth.uid()
      AND am2.user_id = belt_tests.student_id
      AND am1.role IN ('admin', 'owner')
      AND am1.is_active = true
      AND am2.is_active = true
  )
);

-- Admin/Owner write access (DELETE)
CREATE POLICY "belt_tests_delete_admin_owner"
ON public.belt_tests
FOR DELETE
USING (
  get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text])
  AND EXISTS (
    SELECT 1
    FROM public.academy_memberships am1
    JOIN public.academy_memberships am2 ON am1.academy_id = am2.academy_id
    WHERE am1.user_id = auth.uid()
      AND am2.user_id = belt_tests.student_id
      AND am1.role IN ('admin', 'owner')
      AND am1.is_active = true
      AND am2.is_active = true
  )
);
