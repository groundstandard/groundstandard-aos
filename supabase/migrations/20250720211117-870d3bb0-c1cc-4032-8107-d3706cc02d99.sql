-- Create comprehensive multi-tenant architecture (corrected)

-- Create enhanced academies table 
CREATE TABLE IF NOT EXISTS public.academies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- For subdomains
  description TEXT,
  website_url TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'USA',
  timezone TEXT DEFAULT 'America/New_York',
  
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#1E40AF',
  custom_domain TEXT UNIQUE,
  
  -- Subscription info
  subscription_plan_id UUID REFERENCES public.subscription_plans(id),
  subscription_status TEXT DEFAULT 'trial',
  subscription_start DATE DEFAULT CURRENT_DATE,
  subscription_end DATE,
  trial_end DATE DEFAULT (CURRENT_DATE + INTERVAL '14 days'),
  
  -- Features & Limits
  max_students INTEGER DEFAULT 50,
  features JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  is_setup_complete BOOLEAN DEFAULT false,
  
  -- Metadata
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create academy management functions
CREATE OR REPLACE FUNCTION public.get_user_academy_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT academy_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.can_access_academy(academy_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND academy_id = academy_uuid
  );
$$;

-- Enable RLS
ALTER TABLE public.academies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for academies
CREATE POLICY "Users can view academies they belong to" 
ON public.academies 
FOR SELECT 
USING (
  auth.uid() = owner_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.academy_id = academies.id)
);

CREATE POLICY "Academy owners can update their academy" 
ON public.academies 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create academies" 
ON public.academies 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- Create triggers
CREATE OR REPLACE TRIGGER update_academies_updated_at
BEFORE UPDATE ON public.academies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_academies_slug ON public.academies(slug);
CREATE INDEX IF NOT EXISTS idx_academies_owner_id ON public.academies(owner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_academy_id ON public.profiles(academy_id);