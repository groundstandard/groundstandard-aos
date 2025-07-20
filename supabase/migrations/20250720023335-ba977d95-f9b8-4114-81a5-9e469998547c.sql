-- Update a few existing contacts to be members so you can test the assignment feature
UPDATE public.profiles 
SET role = 'member' 
WHERE email IN (
  'abigail.robinson@email.com',
  'aaliyah.howard@email.com',
  'alex.chen@email.com'
);