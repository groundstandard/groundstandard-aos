-- Fix billing cycle constraint and add 12-month support
-- First, drop the existing check constraint for billing_cycle
ALTER TABLE membership_plans DROP CONSTRAINT IF EXISTS membership_plans_billing_cycle_check;

-- Add the updated constraint that includes 'annual'
ALTER TABLE membership_plans ADD CONSTRAINT membership_plans_billing_cycle_check 
CHECK (billing_cycle = ANY (ARRAY['weekly'::text, 'monthly'::text, 'annual'::text, 'quarterly'::text]));

-- Now add some annual plans
INSERT INTO membership_plans (name, description, base_price_cents, billing_cycle, classes_per_week, is_unlimited, age_group, trial_days, is_active)
VALUES 
    ('Basic Annual Plan', 'Annual membership with 12-month commitment - unlimited classes', 99000, 'annual', NULL, true, 'all', 7, true),
    ('Premium Annual Plan', 'Premium annual membership with personal training included', 149000, 'annual', NULL, true, 'all', 7, true),
    ('Family Annual Plan', 'Family annual membership for up to 4 members', 179000, 'annual', NULL, true, 'all', 7, true);

-- Create table for membership subscriptions with 12-month cycle tracking
CREATE TABLE IF NOT EXISTS public.membership_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    membership_plan_id UUID NOT NULL REFERENCES membership_plans(id),
    stripe_subscription_id TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired', 'cancelled')),
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

-- Add trigger for updating timestamps
CREATE TRIGGER update_membership_subscriptions_updated_at
    BEFORE UPDATE ON public.membership_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();