-- Allow only admin/owner to delete audit logs

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and owners can delete audit logs" ON public.audit_logs;
CREATE POLICY "Admins and owners can delete audit logs" ON public.audit_logs
FOR DELETE
USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));
