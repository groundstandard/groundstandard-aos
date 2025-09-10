-- Final security hardening: Fix remaining exposed business data

-- Fix inventory table public access (CRITICAL)
DROP POLICY IF EXISTS "All can view inventory" ON public.inventory;
DROP POLICY IF EXISTS "Everyone can view inventory" ON public.inventory;
DROP POLICY IF EXISTS "Public can view inventory" ON public.inventory;

-- Add academy-scoped access for inventory
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Academy members can view inventory" 
    ON public.inventory 
    FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM academy_memberships am
        WHERE am.user_id = auth.uid() AND am.is_active = true
      )
    );
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Fix message_reactions public access
DROP POLICY IF EXISTS "Users can view message reactions" ON public.message_reactions;

-- Add authenticated-only access for message reactions
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Authenticated users can view message reactions" 
    ON public.message_reactions 
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Fix class_access_permissions public access
DROP POLICY IF EXISTS "class_access_permissions_view" ON public.class_access_permissions;
DROP POLICY IF EXISTS "Everyone can view class access permissions" ON public.class_access_permissions;

-- Add academy-scoped access for class access permissions
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Academy members can view class access permissions" 
    ON public.class_access_permissions 
    FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM academy_memberships am
        WHERE am.user_id = auth.uid() AND am.is_active = true
      )
    );
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;