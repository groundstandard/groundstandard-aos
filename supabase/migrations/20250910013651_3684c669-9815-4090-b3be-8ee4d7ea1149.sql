-- Secure payment_methods table with proper RLS
-- 1) Enable RLS and drop any existing permissive policies
DO $$
BEGIN
  -- Enable RLS (safe if already enabled)
  EXECUTE 'ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY';

  -- Drop all existing policies on payment_methods to remove permissive access
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'payment_methods'
  ) THEN
    EXECUTE (
      SELECT string_agg(
        format('DROP POLICY IF EXISTS %I ON public.payment_methods;', polname), ' '
      )
      FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'payment_methods'
    );
  END IF;
END$$;

-- 2) Create strict RLS policies
-- Users can read only their own payment methods; staff (owner/admin/instructor) can read within the same academy
CREATE POLICY "pm_select_own_or_staff_same_academy"
ON public.payment_methods
FOR SELECT
USING (
  contact_id = auth.uid()
  OR (
    get_current_user_role() = ANY (ARRAY['admin','owner','instructor'])
    AND EXISTS (
      SELECT 1
      FROM academy_memberships am1
      JOIN academy_memberships am2 ON am1.academy_id = am2.academy_id
      WHERE am1.user_id = auth.uid()
        AND am2.user_id = payment_methods.contact_id
        AND am1.is_active = true
        AND am2.is_active = true
    )
  )
);

-- Users can insert only their own; admins/owners can insert for contacts in the same academy
CREATE POLICY "pm_insert_own_or_admin_same_academy"
ON public.payment_methods
FOR INSERT
WITH CHECK (
  contact_id = auth.uid()
  OR (
    get_current_user_role() = ANY (ARRAY['admin','owner'])
    AND EXISTS (
      SELECT 1
      FROM academy_memberships am1
      JOIN academy_memberships am2 ON am1.academy_id = am2.academy_id
      WHERE am1.user_id = auth.uid()
        AND am2.user_id = payment_methods.contact_id
        AND am1.is_active = true
        AND am2.is_active = true
    )
  )
);

-- Users can update only their own; admins/owners can update for contacts in the same academy
CREATE POLICY "pm_update_own_or_admin_same_academy"
ON public.payment_methods
FOR UPDATE
USING (
  contact_id = auth.uid()
  OR (
    get_current_user_role() = ANY (ARRAY['admin','owner'])
    AND EXISTS (
      SELECT 1
      FROM academy_memberships am1
      JOIN academy_memberships am2 ON am1.academy_id = am2.academy_id
      WHERE am1.user_id = auth.uid()
        AND am2.user_id = payment_methods.contact_id
        AND am1.is_active = true
        AND am2.is_active = true
    )
  )
)
WITH CHECK (
  contact_id = auth.uid()
  OR (
    get_current_user_role() = ANY (ARRAY['admin','owner'])
    AND EXISTS (
      SELECT 1
      FROM academy_memberships am1
      JOIN academy_memberships am2 ON am1.academy_id = am2.academy_id
      WHERE am1.user_id = auth.uid()
        AND am2.user_id = payment_methods.contact_id
        AND am1.is_active = true
        AND am2.is_active = true
    )
  )
);

-- Users can delete only their own; admins/owners can delete for contacts in the same academy
CREATE POLICY "pm_delete_own_or_admin_same_academy"
ON public.payment_methods
FOR DELETE
USING (
  contact_id = auth.uid()
  OR (
    get_current_user_role() = ANY (ARRAY['admin','owner'])
    AND EXISTS (
      SELECT 1
      FROM academy_memberships am1
      JOIN academy_memberships am2 ON am1.academy_id = am2.academy_id
      WHERE am1.user_id = auth.uid()
        AND am2.user_id = payment_methods.contact_id
        AND am1.is_active = true
        AND am2.is_active = true
    )
  )
);
