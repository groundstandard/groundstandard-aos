-- Update the existing function to use a simpler approach that avoids recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
BEGIN
    -- Use a direct query that bypasses RLS policies completely
    -- This prevents infinite recursion
    PERFORM set_config('row_security', 'off', true);
    
    SELECT role INTO user_role 
    FROM public.profiles 
    WHERE id = auth.uid() 
    LIMIT 1;
    
    PERFORM set_config('row_security', 'on', true);
    
    RETURN COALESCE(user_role, 'student');
EXCEPTION
    WHEN OTHERS THEN
        PERFORM set_config('row_security', 'on', true);
        RETURN 'student';
END;
$$;