-- Clean up all problematic RLS policies on profiles table
-- Drop all existing policies that could cause recursion
DROP POLICY IF EXISTS "Admins can manage profiles in their academy" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile data" ON public.profiles;
DROP POLICY IF EXISTS "Users can view basic profile info" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in their academy" ON public.profiles;
DROP POLICY IF EXISTS "own_profile_access" ON public.profiles;
DROP POLICY IF EXISTS "system_profile_insert" ON public.profiles;

-- Keep only the safe, non-recursive policies we created
-- profiles_own_access and profiles_system_insert should already exist from the previous migration

-- Verify RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;