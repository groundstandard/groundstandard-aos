-- Drop the problematic admin policy that's still causing recursion
DROP POLICY IF EXISTS "Enable admin read access" ON public.profiles;

-- Update the get_current_user_role function to avoid recursion
DROP FUNCTION IF EXISTS public.get_current_user_role();

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Disable RLS temporarily to avoid recursion
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Create a simple admin policy using the security definer function
CREATE POLICY "Admins can view all profiles using function" 
ON public.profiles 
FOR SELECT 
USING (public.get_current_user_role() = ANY(ARRAY['admin', 'owner']));