-- Revert attendance RLS policy to require active memberships
DROP POLICY IF EXISTS "attendance_academy_isolation" ON public.attendance;

-- Create new policy that requires both users to have active academy memberships
-- AND the student must have an active membership status
CREATE POLICY "attendance_academy_isolation" ON public.attendance
FOR ALL
USING (
  -- User can see their own attendance
  auth.uid() = student_id 
  OR 
  -- Admin/staff can manage attendance for students in same academy who have active memberships
  (EXISTS (
    SELECT 1 FROM academy_memberships am1
    JOIN academy_memberships am2 ON am1.academy_id = am2.academy_id
    JOIN profiles p ON p.id = attendance.student_id
    WHERE am1.user_id = auth.uid() 
    AND am2.user_id = attendance.student_id
    AND am1.is_active = true 
    AND am2.is_active = true
    AND p.membership_status = 'active'
  ))
);