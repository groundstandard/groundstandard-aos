-- Create a secure function to update user's academy association
CREATE OR REPLACE FUNCTION public.join_academy(academy_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the user's profile to associate with the academy
  UPDATE profiles 
  SET academy_id = academy_uuid, 
      updated_at = now()
  WHERE id = auth.uid();
  
  -- Return true if the update was successful
  RETURN FOUND;
END;
$$;