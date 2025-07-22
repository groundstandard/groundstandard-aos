-- Phase 1: Multi-Academy Database Schema Changes
-- CRITICAL: Prevent data leakage between academies

-- 1. Add last_academy_id to profiles for auto-login to most recent academy
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_academy_id UUID REFERENCES public.academies(id);

-- 2. Create many-to-many relationship table for user-academy memberships
CREATE TABLE IF NOT EXISTS public.academy_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('owner', 'admin', 'instructor', 'staff', 'student')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    invited_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id, academy_id)
);

-- 3. Create academy switching audit log
CREATE TABLE IF NOT EXISTS public.academy_switches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    from_academy_id UUID REFERENCES public.academies(id),
    to_academy_id UUID REFERENCES public.academies(id),
    switched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ip_address INET,
    user_agent TEXT
);

-- 4. Migrate existing user-academy relationships to new table
INSERT INTO public.academy_memberships (user_id, academy_id, role, joined_at, is_active)
SELECT id, academy_id, role, created_at, true
FROM public.profiles 
WHERE academy_id IS NOT NULL
ON CONFLICT (user_id, academy_id) DO NOTHING;

-- 5. Set last_academy_id to current academy_id for existing users
UPDATE public.profiles 
SET last_academy_id = academy_id 
WHERE academy_id IS NOT NULL AND last_academy_id IS NULL;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_academy_memberships_user_id ON public.academy_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_memberships_academy_id ON public.academy_memberships(academy_id);
CREATE INDEX IF NOT EXISTS idx_academy_memberships_active ON public.academy_memberships(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_profiles_last_academy ON public.profiles(last_academy_id);

-- 7. Enable RLS on new tables
ALTER TABLE public.academy_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_switches ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for academy_memberships (CRITICAL for data isolation)
CREATE POLICY "Users can view their own academy memberships"
ON public.academy_memberships FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Academy owners can view their academy memberships"
ON public.academy_memberships FOR SELECT
USING (
    academy_id IN (
        SELECT id FROM public.academies WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "Academy owners can manage memberships"
ON public.academy_memberships FOR ALL
USING (
    academy_id IN (
        SELECT id FROM public.academies WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "System can insert memberships"
ON public.academy_memberships FOR INSERT
WITH CHECK (true);

-- 9. Create RLS policies for academy_switches (audit trail)
CREATE POLICY "Users can view their own academy switches"
ON public.academy_switches FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can insert academy switches"
ON public.academy_switches FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 10. Create helper functions for multi-academy access control
CREATE OR REPLACE FUNCTION public.get_user_academies(target_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(academy_id UUID, role TEXT, academy_name TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        am.academy_id,
        am.role,
        a.name as academy_name
    FROM public.academy_memberships am
    JOIN public.academies a ON am.academy_id = a.id
    WHERE am.user_id = target_user_id 
    AND am.is_active = true
    ORDER BY am.joined_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.user_has_academy_access(target_academy_id UUID, target_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.academy_memberships
        WHERE user_id = target_user_id 
        AND academy_id = target_academy_id 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_role_in_academy(target_academy_id UUID, target_user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.academy_memberships
    WHERE user_id = target_user_id 
    AND academy_id = target_academy_id 
    AND is_active = true;
    
    RETURN COALESCE(user_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;