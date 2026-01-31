-- Fix profiles_select_staff_for_students policy
-- Root cause: direct joins against academy_memberships are blocked by RLS for students,
-- which prevents students from seeing staff/admin profiles (e.g., promoter/evaluator names).

DROP POLICY IF EXISTS "profiles_select_staff_for_students" ON public.profiles;

CREATE POLICY "profiles_select_staff_for_students"
ON public.profiles
FOR SELECT
USING (
  get_current_user_role() = 'student'
  AND (
    EXISTS (
      SELECT 1
      FROM public.get_user_academies(auth.uid()) ua
      JOIN public.get_user_academies(profiles.id) ta
        ON ua.academy_id = ta.academy_id
      WHERE ua.academy_id = ta.academy_id
        AND public.get_user_role_in_academy(ua.academy_id, profiles.id) = ANY (ARRAY['owner','admin','instructor','staff'])
    )
    OR EXISTS (
      SELECT 1
      FROM public.belt_tests bt
      WHERE bt.student_id = auth.uid()
        AND bt.evaluated_by = profiles.id
    )
    OR EXISTS (
      SELECT 1
      FROM public.student_belt_history sbh
      WHERE sbh.student_id = auth.uid()
        AND sbh.promoted_by = profiles.id
    )
  )
);
