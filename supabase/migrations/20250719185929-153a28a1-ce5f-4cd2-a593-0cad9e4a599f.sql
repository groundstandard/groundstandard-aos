-- Add API key field back to highlevel_config for multi-tenant support
-- Add user_id field to associate configs with specific users
-- Modify table to support multiple configurations

ALTER TABLE public.highlevel_config 
ADD COLUMN api_key TEXT,
ADD COLUMN user_id UUID REFERENCES auth.users;

-- Create unique constraint to ensure one config per user
CREATE UNIQUE INDEX idx_highlevel_config_user_id ON public.highlevel_config(user_id);

-- Update RLS policies to be user-specific
DROP POLICY IF EXISTS "Admins can manage HighLevel config" ON public.highlevel_config;

CREATE POLICY "Users can manage their own HighLevel config" 
ON public.highlevel_config 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own HighLevel config" 
ON public.highlevel_config 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);