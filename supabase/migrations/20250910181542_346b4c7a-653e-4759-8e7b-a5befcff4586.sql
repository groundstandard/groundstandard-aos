-- Create prices table with proper RLS policies
CREATE TABLE IF NOT EXISTS public.prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add unique constraint for academy + name combination
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'prices_academy_name_unique'
  ) THEN
    ALTER TABLE public.prices ADD CONSTRAINT prices_academy_name_unique UNIQUE (academy_id, name);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prices table
DO $$
BEGIN
  -- Academy members can view prices
  BEGIN
    CREATE POLICY "Academy members can view prices"
    ON public.prices
    FOR SELECT
    USING (academy_id IN (
      SELECT am.academy_id
      FROM academy_memberships am
      WHERE am.user_id = auth.uid() AND am.is_active = true
    ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  -- Owners and admins can manage prices  
  BEGIN
    CREATE POLICY "Owners and admins can manage prices"
    ON public.prices
    FOR ALL
    USING (academy_id IN (
      SELECT am.academy_id
      FROM academy_memberships am
      WHERE am.user_id = auth.uid() 
      AND am.is_active = true 
      AND am.role IN ('owner', 'admin')
    ))
    WITH CHECK (academy_id IN (
      SELECT am.academy_id
      FROM academy_memberships am
      WHERE am.user_id = auth.uid() 
      AND am.is_active = true 
      AND am.role IN ('owner', 'admin')
    ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Add updated_at trigger for prices
CREATE OR REPLACE FUNCTION public.update_prices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_prices_updated_at_trigger'
  ) THEN
    CREATE TRIGGER update_prices_updated_at_trigger
    BEFORE UPDATE ON public.prices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_prices_updated_at();
  END IF;
END $$;

-- Add unique constraint on business_config for idempotent upserts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'business_config_academy_key_unique'
  ) THEN
    ALTER TABLE public.business_config ADD CONSTRAINT business_config_academy_key_unique UNIQUE (academy_id, key);
  END IF;
END $$;

-- Seed business_config for the first academy (if any academies exist)
DO $$
DECLARE
  first_academy_id UUID;
BEGIN
  SELECT id INTO first_academy_id FROM public.academies ORDER BY created_at ASC LIMIT 1;
  
  IF first_academy_id IS NOT NULL THEN
    -- Seed default configurations
    INSERT INTO public.business_config (academy_id, key, value) VALUES
    (first_academy_id, 'pricing_strategy', '{"model": "flat", "currency": "USD", "tax_inclusive": false, "payment_terms": "immediate"}'),
    (first_academy_id, 'membership_model', '{"trial_days": 7, "trial_enabled": true, "auto_renewal": true, "family_discounts": false}'),
    (first_academy_id, 'tax_settings', '{"enabled": false, "rate": 0.0875, "inclusive": false}'),
    (first_academy_id, 'belt_curriculum', '{"system": "brazilian_jiu_jitsu", "testing_enabled": true, "stripe_requirements": false}'),
    (first_academy_id, 'class_schedule', '{"booking_window_hours": 24, "cancellation_window_hours": 4, "max_reservations_per_student": 3, "waitlist_enabled": true}')
    ON CONFLICT (academy_id, key) DO NOTHING;
  END IF;
END $$;