-- Fix the get_current_user_role function without dropping it
-- Replace it with a non-recursive version
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
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

-- Now update the profiles policies to be simpler and avoid recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

-- Create simple, safe policies
CREATE POLICY "profiles_select" 
ON public.profiles FOR SELECT 
USING (
    auth.uid() = id 
    OR 
    EXISTS (
        SELECT 1 FROM public.academies 
        WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "profiles_update" 
ON public.profiles FOR UPDATE 
USING (
    auth.uid() = id 
    OR 
    EXISTS (
        SELECT 1 FROM public.academies 
        WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "profiles_insert" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);