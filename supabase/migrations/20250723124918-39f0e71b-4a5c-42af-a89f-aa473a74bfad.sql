-- Add class length tracking columns to classes table
ALTER TABLE public.classes 
ADD COLUMN class_length_type TEXT DEFAULT 'indefinite' CHECK (class_length_type IN ('indefinite', 'weeks', 'sessions')),
ADD COLUMN class_length_value INTEGER DEFAULT NULL;