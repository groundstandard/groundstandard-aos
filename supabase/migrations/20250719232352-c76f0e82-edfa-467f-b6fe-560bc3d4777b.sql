-- Update bobby@groundstandard.com to owner role
UPDATE public.profiles 
SET role = 'owner' 
WHERE email = 'bobby@groundstandard.com';