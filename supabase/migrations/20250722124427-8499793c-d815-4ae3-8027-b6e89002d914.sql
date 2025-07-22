-- Fix the audit_role_changes trigger to avoid recursion
-- and re-enable RLS with proper policies

-- First, fix the audit_role_changes function to be safer
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log role changes, and only for UPDATE operations
  IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (
      auth.uid(),
      'role_change',
      'profiles',
      NEW.id,
      jsonb_build_object('role', OLD.role),
      jsonb_build_object('role', NEW.role)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Re-enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove the temporary policy
DROP POLICY IF EXISTS "temp_authenticated_read_all" ON public.profiles;

-- Create final, simple policies that won't cause recursion
CREATE POLICY "profiles_own_access" 
ON public.profiles 
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_system_insert"
ON public.profiles
FOR INSERT
WITH CHECK (true);

-- Fix the get_current_user_role function to work properly
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
BEGIN
    -- Safely get the user's role without causing recursion
    SELECT role INTO user_role 
    FROM public.profiles 
    WHERE id = auth.uid() 
    LIMIT 1;
    
    RETURN COALESCE(user_role, 'student');
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'student';
END;
$$;