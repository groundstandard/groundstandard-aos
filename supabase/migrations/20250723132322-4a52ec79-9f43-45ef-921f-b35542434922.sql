-- Add start_date field to classes table
ALTER TABLE public.classes 
ADD COLUMN start_date date;

-- Update existing classes to have a start date (set to current date as default)
UPDATE public.classes 
SET start_date = CURRENT_DATE 
WHERE start_date IS NULL;