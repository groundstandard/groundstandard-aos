-- Update RLS policy to allow both admin and owner roles to manage membership plans
DROP POLICY IF EXISTS "Admins can manage membership plans" ON public.membership_plans;

CREATE POLICY "Admins and owners can manage membership plans" 
ON public.membership_plans 
FOR ALL 
USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

-- Also update the other tables to allow both admin and owner roles
DROP POLICY IF EXISTS "Admins can manage private sessions" ON public.private_sessions;
CREATE POLICY "Admins and owners can manage private sessions" 
ON public.private_sessions 
FOR ALL 
USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

DROP POLICY IF EXISTS "Admins can manage drop in options" ON public.drop_in_options;
CREATE POLICY "Admins and owners can manage drop in options" 
ON public.drop_in_options 
FOR ALL 
USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

DROP POLICY IF EXISTS "Admins can manage discount types" ON public.discount_types;
CREATE POLICY "Admins and owners can manage discount types" 
ON public.discount_types 
FOR ALL 
USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));