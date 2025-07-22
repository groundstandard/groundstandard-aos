-- Add RLS policy to allow academy admins/owners to create contacts
CREATE POLICY "Academy admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.academy_memberships am
    WHERE am.user_id = auth.uid() 
    AND am.academy_id = profiles.academy_id
    AND am.role IN ('admin', 'owner')
    AND am.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.academy_memberships am
    WHERE am.user_id = auth.uid() 
    AND am.academy_id = profiles.academy_id
    AND am.role IN ('admin', 'owner')
    AND am.is_active = true
  )
);