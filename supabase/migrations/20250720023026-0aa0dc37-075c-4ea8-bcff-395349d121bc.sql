-- Update the RLS policy to allow both admins and owners to manage all profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

CREATE POLICY "Admins and owners can manage all profiles" ON public.profiles
FOR ALL
USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));