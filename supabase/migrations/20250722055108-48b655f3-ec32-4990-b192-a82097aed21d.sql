-- Add 'visitor' to the valid roles constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS valid_roles;

ALTER TABLE public.profiles ADD CONSTRAINT valid_roles 
CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'staff'::text, 'member'::text, 'student'::text, 'instructor'::text, 'visitor'::text]));

-- Update some contacts to be visitors
UPDATE public.profiles 
SET role = 'visitor', membership_status = 'inactive'
WHERE id IN (
  SELECT id FROM public.profiles 
  WHERE role = 'student' 
  ORDER BY id
  LIMIT 12
);