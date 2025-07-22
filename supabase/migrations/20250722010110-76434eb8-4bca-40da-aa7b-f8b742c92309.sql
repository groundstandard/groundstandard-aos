-- Fix infinite recursion in profiles table RLS policies
-- First, drop problematic policies that cause recursion

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create safe policies using the existing security definer function
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

CREATE POLICY "Admins can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (public.get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]) OR auth.uid() = id);

-- Fix the get_current_user_role function to be more robust
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
DECLARE
    user_role text;
BEGIN
    -- Use a direct query without RLS to avoid recursion
    EXECUTE format('SELECT role FROM %I.profiles WHERE id = %L LIMIT 1', 'public', auth.uid())
    INTO user_role;
    
    RETURN COALESCE(user_role, 'student');
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'student';
END;
$$;