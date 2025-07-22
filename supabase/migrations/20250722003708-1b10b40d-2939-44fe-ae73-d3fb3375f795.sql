-- Drop the problematic policy that references profiles table
DROP POLICY IF EXISTS "Users can view their academy" ON public.academies;

-- Create a simpler policy that doesn't cause recursion
CREATE POLICY "Users can view their own academy" 
ON public.academies 
FOR SELECT 
USING (owner_id = auth.uid());

-- Make sure the search policy is working correctly
DROP POLICY IF EXISTS "Anyone can view completed academies for search" ON public.academies;

CREATE POLICY "Public can search completed academies" 
ON public.academies 
FOR SELECT 
TO public
USING (is_setup_complete = true);