-- Fix communication_logs RLS: add proper WITH CHECK for INSERT/UPDATE and include admin/owner access

ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "communication_logs_academy_isolation" ON public.communication_logs;
DROP POLICY IF EXISTS "Admins can manage all communication logs" ON public.communication_logs;
DROP POLICY IF EXISTS "Admins and owners can manage all communication logs" ON public.communication_logs;
DROP POLICY IF EXISTS "Users can view their own communication logs" ON public.communication_logs;

CREATE POLICY "communication_logs_select"
ON public.communication_logs
FOR SELECT
USING (
  get_current_user_role() = ANY (ARRAY['admin','owner'])
  OR auth.uid() = contact_id
  OR (
    get_current_user_role() = 'student'
    AND communication_logs.message_type = 'announcement'
    AND (communication_logs.metadata->>'target_audience') = ANY (ARRAY['all','students'])
    AND EXISTS (
      SELECT 1
      FROM public.academy_memberships am
      WHERE am.user_id = auth.uid()
        AND am.is_active = true
        AND am.academy_id::text = (communication_logs.metadata->>'academy_id')
    )
  )
);

CREATE POLICY "communication_logs_insert"
ON public.communication_logs
FOR INSERT
WITH CHECK (
  get_current_user_role() = ANY (ARRAY['admin','owner'])
);

CREATE POLICY "communication_logs_update"
ON public.communication_logs
FOR UPDATE
USING (
  get_current_user_role() = ANY (ARRAY['admin','owner'])
)
WITH CHECK (
  get_current_user_role() = ANY (ARRAY['admin','owner'])
);

CREATE POLICY "communication_logs_delete"
ON public.communication_logs
FOR DELETE
USING (
  get_current_user_role() = ANY (ARRAY['admin','owner'])
);
