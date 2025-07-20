-- Add new membership types: Guardian and frozen
-- Update any existing enum or check constraints for membership_status/membership_type

-- First, let's see what we're working with for membership status
-- We'll add the new options to support Guardian and frozen status

-- Since we're renaming "Membership Status" to "Membership Type" conceptually,
-- we should ensure our profiles table supports these new values
-- Add Guardian and frozen to any existing constraints or enums

-- For now, we'll ensure the profiles table can handle these new string values
-- Guardian: for parents/guardians who aren't active students but are in the system
-- frozen: for members who have temporarily suspended their membership

-- Update any check constraints on profiles table for membership_status
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_membership_status_check;

-- Add new check constraint with all membership types
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_membership_status_check 
CHECK (membership_status IN ('active', 'inactive', 'suspended', 'cancelled', 'pending', 'guardian', 'frozen'));

-- Update any existing data that might conflict (if needed)
-- This is a safe operation since we're adding new values, not changing existing ones