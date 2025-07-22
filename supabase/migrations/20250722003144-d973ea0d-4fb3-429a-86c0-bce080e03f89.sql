-- Create a policy to allow public viewing of completed academy setups for search
CREATE POLICY "Anyone can view completed academies for search" 
ON public.academies 
FOR SELECT 
USING (is_setup_complete = true);