-- Temporarily allow multiple roles per user per academy for testing
-- Drop the unique constraint that prevents multiple memberships
ALTER TABLE public.academy_memberships 
DROP CONSTRAINT IF EXISTS academy_memberships_user_id_academy_id_key;

-- Add a new unique constraint that includes role, allowing multiple roles per user per academy
ALTER TABLE public.academy_memberships 
ADD CONSTRAINT academy_memberships_user_academy_role_unique 
UNIQUE (user_id, academy_id, role);