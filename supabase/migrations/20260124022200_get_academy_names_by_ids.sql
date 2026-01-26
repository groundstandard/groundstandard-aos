-- Resolve academy UUIDs to names for UI display (used by AuditLogViewer)
-- Uses SECURITY DEFINER to avoid RLS issues, but still restricts results
-- to academies the current user is an active member of.

CREATE OR REPLACE FUNCTION public.get_academy_names_by_ids(academy_ids uuid[])
RETURNS TABLE(id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT a.id, a.name
  FROM academies a
  WHERE a.id = ANY (academy_ids)
    AND EXISTS (
      SELECT 1
      FROM academy_memberships am
      WHERE am.user_id = auth.uid()
        AND am.academy_id = a.id
        AND am.is_active = true
    );
$function$;

GRANT EXECUTE ON FUNCTION public.get_academy_names_by_ids(uuid[]) TO authenticated;
