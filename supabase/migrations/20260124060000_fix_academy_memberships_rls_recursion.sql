-- Fix infinite recursion between academies and academy_memberships RLS policies

-- Helper function that checks academy ownership without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_academy_owner(target_academy_id uuid, target_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  result boolean;
BEGIN
  PERFORM set_config('row_security', 'off', true);

  result := EXISTS (
    SELECT 1
    FROM public.academies a
    WHERE a.id = target_academy_id
      AND a.owner_id = target_user_id
  );

  PERFORM set_config('row_security', 'on', true);
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    PERFORM set_config('row_security', 'on', true);
    RETURN false;
END;
$$;

ALTER FUNCTION public.is_academy_owner(uuid, uuid) SET search_path = public;

GRANT EXECUTE ON FUNCTION public.is_academy_owner(uuid, uuid) TO authenticated;

-- Replace academy_memberships owner policies to avoid querying academies directly under RLS
DROP POLICY IF EXISTS "Academy owners can view their academy memberships" ON public.academy_memberships;
DROP POLICY IF EXISTS "Academy owners can manage memberships" ON public.academy_memberships;
DROP POLICY IF EXISTS "academy_memberships_select_owner_scoped" ON public.academy_memberships;

CREATE POLICY "Academy owners can view their academy memberships"
ON public.academy_memberships FOR SELECT
USING (public.is_academy_owner(academy_id));

CREATE POLICY "Academy owners can manage memberships"
ON public.academy_memberships FOR ALL
USING (public.is_academy_owner(academy_id))
WITH CHECK (public.is_academy_owner(academy_id));
