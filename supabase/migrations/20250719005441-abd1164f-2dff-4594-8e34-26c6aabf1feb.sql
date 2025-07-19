-- Update bobby@groundstandard.com to be an admin user
UPDATE public.profiles 
SET role = 'admin', updated_at = now()
WHERE email = 'bobby@groundstandard.com';