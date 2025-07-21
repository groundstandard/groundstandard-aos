-- Add multi-tenancy support with proper academy isolation

-- First, ensure all existing tables reference the academy_id properly
-- Add academy_id to tables that don't have it yet

-- Update profiles table to include academy reference
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS academy_id UUID REFERENCES public.academies(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_academy_id ON public.profiles(academy_id);

-- Update existing profiles to reference the first academy (for existing data)
DO $$
DECLARE
    first_academy_id UUID;
BEGIN
    SELECT id INTO first_academy_id FROM public.academies LIMIT 1;
    
    IF first_academy_id IS NOT NULL THEN
        UPDATE public.profiles 
        SET academy_id = first_academy_id 
        WHERE academy_id IS NULL;
    END IF;
END $$;

-- Make academy_id required for new records
ALTER TABLE public.profiles 
ALTER COLUMN academy_id SET NOT NULL;

-- Update RLS policies for academy isolation
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins and owners can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and owners can manage all profiles" ON public.profiles;

-- Create academy-aware RLS policies for profiles
CREATE POLICY "Users can view profiles in their academy" 
ON public.profiles 
FOR SELECT 
USING (
  academy_id IN (
    SELECT p.academy_id 
    FROM public.profiles p 
    WHERE p.id = auth.uid()
  )
);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid());

CREATE POLICY "Admins can manage profiles in their academy" 
ON public.profiles 
FOR ALL 
USING (
  academy_id IN (
    SELECT p.academy_id 
    FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'owner')
  )
);

-- Academy subscription management table
CREATE TABLE IF NOT EXISTS public.academy_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_type TEXT NOT NULL DEFAULT 'starter', -- starter, professional, enterprise
  status TEXT NOT NULL DEFAULT 'trial', -- trial, active, canceled, past_due
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  max_students INTEGER DEFAULT 50,
  max_instructors INTEGER DEFAULT 3,
  features JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(academy_id)
);

-- Enable RLS on academy subscriptions
ALTER TABLE public.academy_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for academy subscriptions
CREATE POLICY "Academy owners can manage their subscription" 
ON public.academy_subscriptions 
FOR ALL 
USING (
  academy_id IN (
    SELECT a.id 
    FROM public.academies a 
    WHERE a.owner_id = auth.uid()
  )
);

CREATE POLICY "Academy members can view their subscription" 
ON public.academy_subscriptions 
FOR SELECT 
USING (
  academy_id IN (
    SELECT p.academy_id 
    FROM public.profiles p 
    WHERE p.id = auth.uid()
  )
);

-- Academy setup tracking
CREATE TABLE IF NOT EXISTS public.academy_setup_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  step_completed TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_by UUID REFERENCES auth.users(id),
  UNIQUE(academy_id, step_completed)
);

-- Enable RLS on setup progress
ALTER TABLE public.academy_setup_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for setup progress
CREATE POLICY "Academy members can view setup progress" 
ON public.academy_setup_progress 
FOR SELECT 
USING (
  academy_id IN (
    SELECT p.academy_id 
    FROM public.profiles p 
    WHERE p.id = auth.uid()
  )
);

CREATE POLICY "Academy admins can manage setup progress" 
ON public.academy_setup_progress 
FOR ALL 
USING (
  academy_id IN (
    SELECT p.academy_id 
    FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'owner')
  )
);

-- Function to check subscription limits
CREATE OR REPLACE FUNCTION public.check_subscription_limits(
  academy_uuid UUID,
  limit_type TEXT
) RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      WHEN limit_type = 'students' THEN COALESCE(max_students, 50)
      WHEN limit_type = 'instructors' THEN COALESCE(max_instructors, 3)
      ELSE 0
    END
  FROM public.academy_subscriptions 
  WHERE academy_id = academy_uuid;
$$;

-- Function to get current usage counts
CREATE OR REPLACE FUNCTION public.get_academy_usage(
  academy_uuid UUID
) RETURNS JSONB
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'students', (
      SELECT COUNT(*) 
      FROM public.profiles 
      WHERE academy_id = academy_uuid 
      AND role = 'student'
    ),
    'instructors', (
      SELECT COUNT(*) 
      FROM public.profiles 
      WHERE academy_id = academy_uuid 
      AND role IN ('instructor', 'admin', 'owner')
    ),
    'active_classes', (
      SELECT COUNT(*) 
      FROM public.classes 
      WHERE is_active = true
    )
  );
$$;

-- Create default subscription for existing academies
INSERT INTO public.academy_subscriptions (academy_id, plan_type, status, trial_ends_at)
SELECT 
  id,
  'starter',
  'trial',
  now() + INTERVAL '30 days'
FROM public.academies 
WHERE id NOT IN (SELECT academy_id FROM public.academy_subscriptions);

-- Create trigger to automatically create subscription for new academies
CREATE OR REPLACE FUNCTION public.create_academy_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.academy_subscriptions (
    academy_id, 
    plan_type, 
    status, 
    trial_ends_at,
    max_students,
    max_instructors
  ) VALUES (
    NEW.id,
    'starter',
    'trial',
    now() + INTERVAL '30 days',
    50,
    3
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new academies
DROP TRIGGER IF EXISTS on_academy_created ON public.academies;
CREATE TRIGGER on_academy_created
  AFTER INSERT ON public.academies
  FOR EACH ROW EXECUTE FUNCTION public.create_academy_subscription();