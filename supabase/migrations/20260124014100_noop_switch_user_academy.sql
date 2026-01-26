-- Prevent no-op academy switches from generating academy_switches rows (and audit logs)

CREATE OR REPLACE FUNCTION public.switch_user_academy(target_academy_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_id_val uuid := auth.uid();
    has_access boolean := false;
    old_academy_id uuid;
BEGIN
    -- Check if user has access to the target academy
    SELECT EXISTS (
        SELECT 1 FROM academy_memberships
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
    FROM profiles
    WHERE id = user_id_val;

    -- NO-OP guard: if user selects the same academy, do nothing
    IF old_academy_id IS NOT DISTINCT FROM target_academy_id THEN
        RETURN jsonb_build_object(
            'success', true,
            'old_academy_id', old_academy_id,
            'new_academy_id', target_academy_id,
            'no_op', true
        );
    END IF;

    -- Update the user's profile
    UPDATE profiles
    SET last_academy_id = target_academy_id,
        updated_at = now()
    WHERE id = user_id_val;

    -- Log the academy switch
    INSERT INTO academy_switches (
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
$function$;
