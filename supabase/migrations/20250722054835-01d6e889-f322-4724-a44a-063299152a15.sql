-- Update the mock contacts to distribute them across different roles
-- Based on the filter categories: member, visitor, alumni, staff, instructor, admin

-- Update some contacts to be members (was students)
UPDATE public.profiles 
SET role = 'member' 
WHERE id IN (
  SELECT id FROM public.profiles 
  WHERE role = 'student' 
  LIMIT 30
);

-- Update some contacts to be visitors
UPDATE public.profiles 
SET role = 'visitor' 
WHERE id IN (
  SELECT id FROM public.profiles 
  WHERE role = 'student' 
  LIMIT 15
);

-- Update some contacts to be alumni
UPDATE public.profiles 
SET role = 'alumni', membership_status = 'alumni'
WHERE id IN (
  SELECT id FROM public.profiles 
  WHERE role = 'student' 
  LIMIT 12
);

-- Update some contacts to be staff
UPDATE public.profiles 
SET role = 'staff' 
WHERE id IN (
  SELECT id FROM public.profiles 
  WHERE role = 'student' 
  LIMIT 8
);

-- Keep existing instructors and admins, but make sure we have some
UPDATE public.profiles 
SET role = 'instructor' 
WHERE id IN (
  SELECT id FROM public.profiles 
  WHERE role = 'student' 
  LIMIT 10
);

-- Make sure we have some admins too
UPDATE public.profiles 
SET role = 'admin' 
WHERE id IN (
  SELECT id FROM public.profiles 
  WHERE role = 'student' 
  LIMIT 5
);