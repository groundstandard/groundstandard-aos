-- This script will help create a test student account
-- Step 1: First sign up normally with email: student.test@groundstandard.com
-- Step 2: Then run this query to add student memberships to both academies

-- After you sign up with the test email, get the user ID from the profiles table
-- and replace 'YOUR_NEW_USER_ID_HERE' with the actual ID

/*
-- Replace YOUR_NEW_USER_ID_HERE with the actual user ID after signup
INSERT INTO public.academy_memberships (user_id, academy_id, role, is_active, joined_at)
VALUES 
  -- Try A Martial Art - New York, NY (student role)
  ('YOUR_NEW_USER_ID_HERE', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', 'student', true, now()),
  -- Try A Martial Art - Dallas, TX (student role)  
  ('YOUR_NEW_USER_ID_HERE', '4512f5ed-d766-48e0-8bb1-4ffa1e4a7445', 'student', true, now());
*/

-- You can also check what user ID was created with:
-- SELECT id, email, first_name, last_name FROM public.profiles WHERE email = 'student.test@groundstandard.com';