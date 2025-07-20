-- Add new membership types: Guardian and frozen
-- Update constraint to include all existing values plus new ones

-- Remove existing constraint if it exists
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_membership_status_check;

-- Add new check constraint with all membership types including existing 'alumni'
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_membership_status_check 
CHECK (membership_status IN ('active', 'inactive', 'suspended', 'cancelled', 'pending', 'guardian', 'frozen', 'alumni'));