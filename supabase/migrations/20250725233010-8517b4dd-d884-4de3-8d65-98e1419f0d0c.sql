-- Fix the security warning for the set_class_academy_id function
-- by setting the search_path parameter
CREATE OR REPLACE FUNCTION public.set_class_academy_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Set academy_id based on the creating user's active academy membership
  IF NEW.academy_id IS NULL THEN
    SELECT am.academy_id INTO NEW.academy_id
    FROM academy_memberships am
    WHERE am.user_id = auth.uid() 
    AND am.is_active = true
    AND am.role IN ('admin', 'owner')
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$;