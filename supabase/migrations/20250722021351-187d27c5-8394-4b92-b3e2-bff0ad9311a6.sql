CREATE OR REPLACE FUNCTION public.get_user_academies(target_user_id uuid DEFAULT auth.uid())
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
    ORDER BY am.joined_at DESC;
$function$