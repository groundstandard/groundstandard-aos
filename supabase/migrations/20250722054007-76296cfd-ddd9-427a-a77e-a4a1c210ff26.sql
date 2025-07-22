-- Add missing fields to profiles table for contact management
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zipcode TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS student_id TEXT,
ADD COLUMN IF NOT EXISTS check_in_pin TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS highlevel_contact_id TEXT,
ADD COLUMN IF NOT EXISTS last_academy_id UUID,
ADD COLUMN IF NOT EXISTS academy_id UUID;

-- Create unique constraint for check_in_pin if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_check_in_pin_key'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_check_in_pin_key UNIQUE (check_in_pin);
    END IF;
END $$;

-- Create index on academy_id for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_academy_id ON public.profiles(academy_id);
CREATE INDEX IF NOT EXISTS idx_profiles_last_academy_id ON public.profiles(last_academy_id);