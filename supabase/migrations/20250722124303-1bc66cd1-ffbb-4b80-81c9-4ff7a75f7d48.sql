-- TEMPORARILY DISABLE RLS ON PROFILES TO TEST
-- This will help us isolate if the issue is truly with RLS policies
-- or something else in the system

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Also check if there are any triggers on profiles that might be causing issues
-- Let's see what triggers exist
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';