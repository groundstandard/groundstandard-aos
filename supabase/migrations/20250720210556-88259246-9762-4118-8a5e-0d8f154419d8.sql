-- Create comprehensive multi-tenant architecture

-- Create academies table (enhanced version)
DROP TABLE IF EXISTS public.academies CASCADE;
CREATE TABLE public.academies (
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

-- Add academy_id to all existing tables for multi-tenancy
ALTER TABLE public.profiles ADD COLUMN academy_id UUID REFERENCES public.academies(id);
ALTER TABLE public.classes ADD COLUMN academy_id UUID REFERENCES public.academies(id);
ALTER TABLE public.attendance ADD COLUMN academy_id UUID REFERENCES public.academies(id);
ALTER TABLE public.events ADD COLUMN academy_id UUID REFERENCES public.academies(id);
ALTER TABLE public.payments ADD COLUMN academy_id UUID REFERENCES public.academies(id);
ALTER TABLE public.membership_plans ADD COLUMN academy_id UUID REFERENCES public.academies(id);
ALTER TABLE public.subscribers ADD COLUMN academy_id UUID REFERENCES public.academies(id);

-- Create academy invitations table
CREATE TABLE public.academy_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID REFERENCES public.academies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'instructor',
  invited_by UUID REFERENCES auth.users(id),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create academy settings table
CREATE TABLE public.academy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID UNIQUE REFERENCES public.academies(id) ON DELETE CASCADE,
  
  -- General settings
  allow_student_self_signup BOOLEAN DEFAULT false,
  require_parent_approval BOOLEAN DEFAULT true,
  auto_assign_student_id BOOLEAN DEFAULT true,
  
  -- Communication settings
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  parent_portal_access BOOLEAN DEFAULT true,
  
  -- Payment settings
  payment_terms_days INTEGER DEFAULT 30,
  late_fee_amount INTEGER DEFAULT 500, -- in cents
  late_fee_grace_days INTEGER DEFAULT 7,
  
  -- Class settings
  default_class_duration INTEGER DEFAULT 60,
  allow_online_booking BOOLEAN DEFAULT true,
  require_payment_for_booking BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for academies
CREATE POLICY "Users can view academies they belong to" 
ON public.academies 
FOR SELECT 
USING (
  auth.uid() = owner_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.academy_id = academies.id)
);

CREATE POLICY "Academy owners can update their academy" 
ON public.academies 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create academies" 
ON public.academies 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- Create RLS policies for academy_invitations
CREATE POLICY "Academy members can view invitations" 
ON public.academy_invitations 
FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.academy_id = academy_invitations.academy_id)
  OR invited_by = auth.uid()
);

CREATE POLICY "Academy owners and admins can manage invitations" 
ON public.academy_invitations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    JOIN public.academies a ON p.academy_id = a.id 
    WHERE p.user_id = auth.uid() 
    AND a.id = academy_invitations.academy_id
    AND (p.role IN ('admin', 'owner') OR a.owner_id = auth.uid())
  )
);

-- Create RLS policies for academy_settings
CREATE POLICY "Academy members can view settings" 
ON public.academy_settings 
FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.academy_id = academy_settings.academy_id)
);

CREATE POLICY "Academy owners and admins can manage settings" 
ON public.academy_settings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    JOIN public.academies a ON p.academy_id = a.id 
    WHERE p.user_id = auth.uid() 
    AND a.id = academy_settings.academy_id
    AND (p.role IN ('admin', 'owner') OR a.owner_id = auth.uid())
  )
);

-- Update existing RLS policies to include academy isolation
DROP POLICY IF EXISTS "Students can view their own attendance" ON public.attendance;
CREATE POLICY "Users can view attendance in their academy" 
ON public.attendance 
FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.academy_id = attendance.academy_id)
);

DROP POLICY IF EXISTS "Admins and owners can manage all attendance" ON public.attendance;
CREATE POLICY "Academy admins can manage attendance" 
ON public.attendance 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.academy_id = attendance.academy_id
    AND profiles.role IN ('admin', 'owner')
  )
);

-- Create function to get user's academy
CREATE OR REPLACE FUNCTION public.get_user_academy_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT academy_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Create function to check if user can access academy
CREATE OR REPLACE FUNCTION public.can_access_academy(academy_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND academy_id = academy_uuid
  );
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_academies_updated_at
BEFORE UPDATE ON public.academies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_academy_settings_updated_at
BEFORE UPDATE ON public.academy_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_academies_slug ON public.academies(slug);
CREATE INDEX idx_academies_owner_id ON public.academies(owner_id);
CREATE INDEX idx_academy_invitations_token ON public.academy_invitations(token);
CREATE INDEX idx_profiles_academy_id ON public.profiles(academy_id);
CREATE INDEX idx_attendance_academy_id ON public.attendance(academy_id);