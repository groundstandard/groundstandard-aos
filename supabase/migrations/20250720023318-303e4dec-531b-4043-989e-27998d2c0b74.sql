-- Fix audit_logs RLS policy to allow inserts from the audit function
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Create a policy that allows inserts for role changes
CREATE POLICY "Allow audit log inserts" ON public.audit_logs
FOR INSERT 
WITH CHECK (true);

-- Also ensure the audit function can read current user role
DROP POLICY IF EXISTS "Admins and owners can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins and owners can view audit logs" ON public.audit_logs
FOR SELECT 
USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));