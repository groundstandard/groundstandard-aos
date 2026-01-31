-- Fix RLS policies for student_belt_history to allow admin/owner/instructor inserts/updates/deletes.

ALTER TABLE public.student_belt_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if present (idempotent)
DROP POLICY IF EXISTS "Admins can manage belt history" ON public.student_belt_history;
DROP POLICY IF EXISTS "Students can view their own belt history" ON public.student_belt_history;
DROP POLICY IF EXISTS "Academy members can view belt history within academy" ON public.student_belt_history;

-- Student read access (own records)
CREATE POLICY "student_belt_history_select_own"
ON public.student_belt_history
FOR SELECT
USING (student_id = auth.uid());

-- Academy isolation read access (members can view belt history of students in same academy)
CREATE POLICY "student_belt_history_select_academy"
ON public.student_belt_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.academy_memberships am1
    JOIN public.academy_memberships am2 ON am1.academy_id = am2.academy_id
    WHERE am1.user_id = auth.uid()
      AND am2.user_id = student_belt_history.student_id
      AND am1.is_active = true
      AND am2.is_active = true
  )
);

-- Admin/Owner/Instructor write access (INSERT)
CREATE POLICY "student_belt_history_insert_admin_owner_instructor"
ON public.student_belt_history
FOR INSERT
WITH CHECK (
  get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text, 'instructor'::text])
  AND EXISTS (
    SELECT 1
    FROM public.academy_memberships am1
    JOIN public.academy_memberships am2 ON am1.academy_id = am2.academy_id
    WHERE am1.user_id = auth.uid()
      AND am2.user_id = student_belt_history.student_id
      AND am1.is_active = true
      AND am2.is_active = true
  )
);

-- Admin/Owner/Instructor write access (UPDATE)
CREATE POLICY "student_belt_history_update_admin_owner_instructor"
ON public.student_belt_history
FOR UPDATE
USING (
  get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text, 'instructor'::text])
  AND EXISTS (
    SELECT 1
    FROM public.academy_memberships am1
    JOIN public.academy_memberships am2 ON am1.academy_id = am2.academy_id
    WHERE am1.user_id = auth.uid()
      AND am2.user_id = student_belt_history.student_id
      AND am1.is_active = true
      AND am2.is_active = true
  )
)
WITH CHECK (
  get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text, 'instructor'::text])
  AND EXISTS (
    SELECT 1
    FROM public.academy_memberships am1
    JOIN public.academy_memberships am2 ON am1.academy_id = am2.academy_id
    WHERE am1.user_id = auth.uid()
      AND am2.user_id = student_belt_history.student_id
      AND am1.is_active = true
      AND am2.is_active = true
  )
);

-- Admin/Owner/Instructor write access (DELETE)
CREATE POLICY "student_belt_history_delete_admin_owner_instructor"
ON public.student_belt_history
FOR DELETE
USING (
  get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text, 'instructor'::text])
  AND EXISTS (
    SELECT 1
    FROM public.academy_memberships am1
    JOIN public.academy_memberships am2 ON am1.academy_id = am2.academy_id
    WHERE am1.user_id = auth.uid()
      AND am2.user_id = student_belt_history.student_id
      AND am1.is_active = true
      AND am2.is_active = true
  )
);
