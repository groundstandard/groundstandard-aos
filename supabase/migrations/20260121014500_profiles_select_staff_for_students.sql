CREATE POLICY "profiles_select_staff_for_students"
ON public.profiles
FOR SELECT
USING (
  get_current_user_role() = 'student'
  AND profiles.role = ANY (ARRAY['admin','owner','instructor'])
  AND (
    EXISTS (
      SELECT 1
      FROM academy_memberships am1
      JOIN academy_memberships am2 ON am1.academy_id = am2.academy_id
      WHERE am1.user_id = auth.uid()
        AND am2.user_id = profiles.id
        AND am1.is_active = true
        AND am2.is_active = true
    )
    OR EXISTS (
      SELECT 1
      FROM academy_memberships am
      JOIN classes c ON c.academy_id = am.academy_id
      WHERE am.user_id = auth.uid()
        AND am.is_active = true
        AND c.instructor_id = profiles.id
    )
  )
);
