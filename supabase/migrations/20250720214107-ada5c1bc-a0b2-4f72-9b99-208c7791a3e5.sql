-- Add zipcode column to academies table
ALTER TABLE public.academies 
ADD COLUMN IF NOT EXISTS zipcode TEXT;