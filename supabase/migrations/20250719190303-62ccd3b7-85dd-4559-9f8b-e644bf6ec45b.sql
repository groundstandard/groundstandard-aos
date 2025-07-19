-- Create academies table for multi-tenant support
CREATE TABLE IF NOT EXISTS public.academies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  owner_id UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on academies
ALTER TABLE public.academies ENABLE ROW LEVEL SECURITY;

-- Add academy_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS academy_id UUID REFERENCES public.academies;

-- Modify highlevel_config to reference academy instead of user
ALTER TABLE public.highlevel_config 
DROP COLUMN IF EXISTS user_id,
ADD COLUMN IF NOT EXISTS academy_id UUID REFERENCES public.academies;

-- Update unique constraint
DROP INDEX IF EXISTS idx_highlevel_config_user_id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_highlevel_config_academy_id ON public.highlevel_config(academy_id);

-- RLS policies for academies
CREATE POLICY "Users can view their academy" 
ON public.academies 
FOR SELECT 
USING (
  owner_id = auth.uid() OR 
  id IN (SELECT academy_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Academy owners can manage their academy" 
ON public.academies 
FOR ALL 
USING (owner_id = auth.uid());

-- Update highlevel_config RLS policies
DROP POLICY IF EXISTS "Users can manage their own HighLevel config" ON public.highlevel_config;
DROP POLICY IF EXISTS "Users can insert their own HighLevel config" ON public.highlevel_config;

CREATE POLICY "Academy members can manage HighLevel config" 
ON public.highlevel_config 
FOR ALL 
USING (
  academy_id IN (
    SELECT academy_id FROM public.profiles WHERE id = auth.uid()
    UNION
    SELECT id FROM public.academies WHERE owner_id = auth.uid()
  )
);

-- Update profiles policies to work with academies
CREATE POLICY "Users can view academy profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id OR 
  (get_current_user_role() = 'admin' AND academy_id IN (
    SELECT academy_id FROM public.profiles WHERE id = auth.uid()
    UNION
    SELECT id FROM public.academies WHERE owner_id = auth.uid()
  ))
);