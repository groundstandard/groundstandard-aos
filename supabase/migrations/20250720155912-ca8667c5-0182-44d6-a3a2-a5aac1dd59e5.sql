-- Add 12-month billing cycle support and membership tracking
-- Add annual billing cycle option to membership plans
UPDATE membership_plans 
SET billing_cycle = 'annual'
WHERE billing_cycle = 'yearly';

-- Insert sample annual plans if none exist
INSERT INTO membership_plans (name, description, base_price_cents, billing_cycle, classes_per_week, is_unlimited, age_group, trial_days, is_active)
SELECT 
    name || ' (Annual)',
    'Annual membership with 12-month commitment - ' || description,
    base_price_cents * 10, -- 10 months price for 12 months
    'annual',
    classes_per_week,
    is_unlimited,
    age_group,
    trial_days,
    is_active
FROM membership_plans 
WHERE billing_cycle = 'monthly' 
AND NOT EXISTS (
    SELECT 1 FROM membership_plans mp2 
    WHERE mp2.name LIKE membership_plans.name || ' (Annual)%'
)
LIMIT 3;

-- Create table for membership subscriptions with 12-month cycle tracking
CREATE TABLE IF NOT EXISTS public.membership_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    membership_plan_id UUID NOT NULL REFERENCES membership_plans(id),
    stripe_subscription_id TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    next_billing_date DATE,
    cycle_number INTEGER DEFAULT 1,
    auto_renewal BOOLEAN DEFAULT true,
    renewal_discount_percentage INTEGER DEFAULT 0,
    discount_expires_at DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_membership_subscriptions_profile_id ON membership_subscriptions(profile_id);
CREATE INDEX IF NOT EXISTS idx_membership_subscriptions_status ON membership_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_membership_subscriptions_end_date ON membership_subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_membership_subscriptions_next_billing ON membership_subscriptions(next_billing_date);

-- Enable RLS
ALTER TABLE public.membership_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own membership subscriptions" 
ON public.membership_subscriptions 
FOR SELECT 
USING (profile_id = auth.uid());

CREATE POLICY "Admins and owners can manage all membership subscriptions" 
ON public.membership_subscriptions 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

CREATE POLICY "Edge functions can manage subscriptions" 
ON public.membership_subscriptions 
FOR ALL 
USING (true);

-- Add trigger for updating timestamps
CREATE TRIGGER update_membership_subscriptions_updated_at
    BEFORE UPDATE ON public.membership_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle membership cycle transitions
CREATE OR REPLACE FUNCTION public.process_membership_cycles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update expired memberships
    UPDATE membership_subscriptions 
    SET status = 'expired'
    WHERE end_date < CURRENT_DATE 
    AND status = 'active'
    AND auto_renewal = false;
    
    -- Handle auto-renewals for 12-month cycles
    UPDATE membership_subscriptions 
    SET 
        cycle_number = cycle_number + 1,
        start_date = end_date,
        end_date = end_date + INTERVAL '12 months',
        next_billing_date = end_date + INTERVAL '1 day',
        renewal_discount_percentage = CASE 
            WHEN discount_expires_at IS NOT NULL AND discount_expires_at <= end_date 
            THEN 0 
            ELSE renewal_discount_percentage 
        END,
        discount_expires_at = CASE 
            WHEN discount_expires_at IS NOT NULL AND discount_expires_at <= end_date 
            THEN NULL 
            ELSE discount_expires_at 
        END,
        updated_at = now()
    WHERE end_date < CURRENT_DATE 
    AND status = 'active'
    AND auto_renewal = true;
END;
$$;