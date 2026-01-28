-- Allow admin/owner profiles to view all academies

CREATE POLICY "Admins can view all academies"
ON public.academies
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role IN ('admin', 'owner')
  )
);
