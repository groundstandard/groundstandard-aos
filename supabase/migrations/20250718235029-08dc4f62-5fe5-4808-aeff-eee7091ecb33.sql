-- Fix infinite recursion in profiles RLS policies by simplifying admin checks
-- Drop the existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create simplified policies that don't cause recursion
-- Users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Users can insert their own profile (this should already exist)
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- For now, let's allow users to view other profiles but not update them
-- This avoids the recursion issue while we set up the app
CREATE POLICY "Users can view other profiles" 
ON public.profiles 
FOR SELECT 
USING (true);