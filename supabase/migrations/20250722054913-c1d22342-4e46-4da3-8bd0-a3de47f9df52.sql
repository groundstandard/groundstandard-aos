-- Update the mock contacts to distribute them across valid roles
-- Valid roles: owner, admin, staff, member, student, instructor

-- Update some contacts to be members (was students)
UPDATE public.profiles 
SET role = 'member' 
WHERE id IN (
  SELECT id FROM public.profiles 
  WHERE role = 'student' 
  ORDER BY id
  LIMIT 25
);

-- Update some contacts to be staff
UPDATE public.profiles 
SET role = 'staff' 
WHERE id IN (
  SELECT id FROM public.profiles 
  WHERE role = 'student' 
  ORDER BY id
  LIMIT 15
);

-- Make sure we have more instructors
UPDATE public.profiles 
SET role = 'instructor' 
WHERE id IN (
  SELECT id FROM public.profiles 
  WHERE role = 'student' 
  ORDER BY id DESC
  LIMIT 12
);

-- Make some contacts alumni by updating their membership status (but keeping student role)
UPDATE public.profiles 
SET membership_status = 'alumni'
WHERE id IN (
  SELECT id FROM public.profiles 
  WHERE role = 'student' 
  ORDER BY id
  LIMIT 8
);

-- Add one owner
UPDATE public.profiles 
SET role = 'owner' 
WHERE id = '00000000-0000-0000-0000-000000000001';