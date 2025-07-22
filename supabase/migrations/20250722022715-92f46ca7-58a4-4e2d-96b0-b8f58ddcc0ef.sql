-- Restructure academy membership system with proper security

-- First, let's improve the get_user_academies function to be more robust
CREATE OR REPLACE FUNCTION public.get_user_academies(target_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(academy_id uuid, role text, academy_name text, city text, state text)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
    SELECT DISTINCT
        am.academy_id,
        am.role,
        a.name as academy_name,
        a.city,
        a.state
    FROM public.academy_memberships am
    JOIN public.academies a ON am.academy_id = a.id
    WHERE am.user_id = target_user_id 
    AND am.is_active = true
    ORDER BY am.joined_at DESC;
$$;

-- Create a secure function to switch academy that handles all the logic
CREATE OR REPLACE FUNCTION public.switch_user_academy(target_academy_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id_val uuid := auth.uid();
    has_access boolean := false;
    old_academy_id uuid;
    result jsonb;
BEGIN
    -- Check if user has access to the target academy
    SELECT EXISTS (
        SELECT 1 FROM public.academy_memberships
        WHERE user_id = user_id_val 
        AND academy_id = target_academy_id 
        AND is_active = true
    ) INTO has_access;
    
    IF NOT has_access THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Access denied to academy'
        );
    END IF;
    
    -- Get current academy for logging
    SELECT last_academy_id INTO old_academy_id
    FROM public.profiles
    WHERE id = user_id_val;
    
    -- Update the user's profile
    UPDATE public.profiles 
    SET last_academy_id = target_academy_id,
        updated_at = now()
    WHERE id = user_id_val;
    
    -- Log the academy switch
    INSERT INTO public.academy_switches (
        user_id,
        from_academy_id,
        to_academy_id
    ) VALUES (
        user_id_val,
        old_academy_id,
        target_academy_id
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'old_academy_id', old_academy_id,
        'new_academy_id', target_academy_id
    );
END;
$$;

-- Ensure proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_academy_memberships_user_academy 
ON public.academy_memberships(user_id, academy_id) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_academy_switches_user_time 
ON public.academy_switches(user_id, switched_at DESC);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_user_academies TO authenticated;
GRANT EXECUTE ON FUNCTION public.switch_user_academy TO authenticated;