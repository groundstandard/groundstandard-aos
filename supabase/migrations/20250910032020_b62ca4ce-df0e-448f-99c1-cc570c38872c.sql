-- Create business_config table for non-sensitive academy settings
CREATE TABLE public.business_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id UUID REFERENCES public.academies(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(academy_id, key)
);

-- Enable RLS
ALTER TABLE public.business_config ENABLE ROW LEVEL SECURITY;

-- Create policies for business config
CREATE POLICY "business_config_read" ON public.business_config
    FOR SELECT 
    USING (
        academy_id IN (
            SELECT am.academy_id 
            FROM academy_memberships am 
            WHERE am.user_id = auth.uid() 
            AND am.is_active = true
        )
    );

CREATE POLICY "business_config_write" ON public.business_config
    FOR ALL 
    USING (
        academy_id IN (
            SELECT am.academy_id 
            FROM academy_memberships am 
            WHERE am.user_id = auth.uid() 
            AND am.is_active = true
            AND am.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        academy_id IN (
            SELECT am.academy_id 
            FROM academy_memberships am 
            WHERE am.user_id = auth.uid() 
            AND am.is_active = true
            AND am.role IN ('owner', 'admin')
        )
    );

-- Add trigger for updated_at
CREATE TRIGGER update_business_config_updated_at
    BEFORE UPDATE ON public.business_config
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample business configuration data for existing academies
INSERT INTO public.business_config (academy_id, key, value)
SELECT 
    id as academy_id,
    'pricing_strategy',
    jsonb_build_object(
        'model', 'tiered',
        'currency', 'USD',
        'tax_inclusive', false,
        'discount_strategy', 'family_based',
        'payment_terms', '30_days'
    )
FROM public.academies 
ON CONFLICT (academy_id, key) DO NOTHING;

INSERT INTO public.business_config (academy_id, key, value)
SELECT 
    id as academy_id,
    'membership_model',
    jsonb_build_object(
        'types', array['monthly', 'quarterly', 'annual'],
        'trial_enabled', true,
        'trial_days', 7,
        'auto_renewal', true,
        'family_discounts', true,
        'class_packs_enabled', true
    )
FROM public.academies 
ON CONFLICT (academy_id, key) DO NOTHING;

INSERT INTO public.business_config (academy_id, key, value)
SELECT 
    id as academy_id,
    'tax_settings',
    jsonb_build_object(
        'enabled', false,
        'rate', 0.0875,
        'inclusive', false,
        'regions', array['NY', 'NJ', 'CT']
    )
FROM public.academies 
ON CONFLICT (academy_id, key) DO NOTHING;

INSERT INTO public.business_config (academy_id, key, value)
SELECT 
    id as academy_id,
    'belt_curriculum',
    jsonb_build_object(
        'system', 'brazilian_jiu_jitsu',
        'belts', array[
            jsonb_build_object('name', 'White', 'order', 1, 'min_months', 0),
            jsonb_build_object('name', 'Blue', 'order', 2, 'min_months', 12),
            jsonb_build_object('name', 'Purple', 'order', 3, 'min_months', 24),
            jsonb_build_object('name', 'Brown', 'order', 4, 'min_months', 18),
            jsonb_build_object('name', 'Black', 'order', 5, 'min_months', 24)
        ],
        'testing_enabled', true,
        'stripe_requirements', true
    )
FROM public.academies 
ON CONFLICT (academy_id, key) DO NOTHING;

INSERT INTO public.business_config (academy_id, key, value)
SELECT 
    id as academy_id,
    'class_schedule',
    jsonb_build_object(
        'timezone', 'America/New_York',
        'booking_window_hours', 24,
        'cancellation_window_hours', 2,
        'max_reservations_per_student', 3,
        'waitlist_enabled', true,
        'auto_confirm_bookings', true
    )
FROM public.academies 
ON CONFLICT (academy_id, key) DO NOTHING;