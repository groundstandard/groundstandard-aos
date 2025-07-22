-- Create a function to get academies filtered by role
CREATE OR REPLACE FUNCTION public.get_user_academies_by_role(target_user_id uuid DEFAULT auth.uid(), role_filter text DEFAULT NULL)
 RETURNS TABLE(academy_id uuid, role text, academy_name text, city text, state text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    SELECT 
        am.academy_id,
        am.role,
        a.name as academy_name,
        a.city,
        a.state
    FROM public.academy_memberships am
    JOIN public.academies a ON am.academy_id = a.id
    WHERE am.user_id = target_user_id 
    AND am.is_active = true
    AND (role_filter IS NULL OR am.role = role_filter)
    ORDER BY am.joined_at DESC;
$function$;

-- Update the existing function to maintain compatibility but add role context
CREATE OR REPLACE FUNCTION public.get_user_academies(target_user_id uuid DEFAULT auth.uid())
 RETURNS TABLE(academy_id uuid, role text, academy_name text, city text, state text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    -- Check if user has only student roles
    SELECT 
        am.academy_id,
        am.role,
        a.name as academy_name,
        a.city,
        a.state
    FROM public.academy_memberships am
    JOIN public.academies a ON am.academy_id = a.id
    WHERE am.user_id = target_user_id 
    AND am.is_active = true
    -- If user has any admin/owner roles, show all. Otherwise show only student roles
    AND (
        EXISTS (
            SELECT 1 FROM public.academy_memberships am2 
            WHERE am2.user_id = target_user_id 
            AND am2.role IN ('owner', 'admin') 
            AND am2.is_active = true
        ) OR am.role = 'student'
    )
    ORDER BY am.joined_at DESC;
$function$;