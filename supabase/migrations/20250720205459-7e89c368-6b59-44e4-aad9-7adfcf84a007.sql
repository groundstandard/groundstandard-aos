-- Create comprehensive subscription and payment infrastructure

-- Create subscription plans table for Stripe integration
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  stripe_price_id TEXT UNIQUE NOT NULL,
  stripe_product_id TEXT NOT NULL,
  price INTEGER NOT NULL, -- Price in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  interval_type TEXT NOT NULL CHECK (interval_type IN ('month', 'year')),
  interval_count INTEGER NOT NULL DEFAULT 1,
  trial_period_days INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create subscribers table for tracking customer subscriptions
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid', 'paused')),
  subscription_tier TEXT,
  stripe_subscription_id TEXT UNIQUE,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  subscription_plan_id UUID REFERENCES public.subscription_plans(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payment transactions table
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES public.subscribers(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_invoice_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'pending', 'failed', 'canceled', 'refunded')),
  payment_method TEXT,
  description TEXT,
  failure_reason TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create subscription events table for audit trail
CREATE TABLE public.subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES public.subscribers(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE,
  event_data JSONB,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create plan changes table for tracking upgrades/downgrades
CREATE TABLE public.plan_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES public.subscribers(id) ON DELETE CASCADE,
  from_plan_id UUID REFERENCES public.subscription_plans(id),
  to_plan_id UUID REFERENCES public.subscription_plans(id),
  change_type TEXT NOT NULL CHECK (change_type IN ('upgrade', 'downgrade', 'side_grade')),
  effective_date TIMESTAMPTZ NOT NULL,
  proration_amount INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_changes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans
CREATE POLICY "Anyone can view active subscription plans" 
ON public.subscription_plans 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans" 
ON public.subscription_plans 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

-- RLS Policies for subscribers
CREATE POLICY "Users can view their own subscription" 
ON public.subscribers 
FOR SELECT 
USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Users can update their own subscription" 
ON public.subscribers 
FOR UPDATE 
USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Edge functions can manage subscriptions" 
ON public.subscribers 
FOR ALL 
USING (true);

CREATE POLICY "Admins can view all subscriptions" 
ON public.subscribers 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

-- RLS Policies for payment_transactions
CREATE POLICY "Users can view their own transactions" 
ON public.payment_transactions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.subscribers 
  WHERE subscribers.id = payment_transactions.subscriber_id 
  AND subscribers.user_id = auth.uid()
));

CREATE POLICY "Edge functions can manage transactions" 
ON public.payment_transactions 
FOR ALL 
USING (true);

CREATE POLICY "Admins can view all transactions" 
ON public.payment_transactions 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

-- RLS Policies for subscription_events
CREATE POLICY "Edge functions can manage events" 
ON public.subscription_events 
FOR ALL 
USING (true);

CREATE POLICY "Admins can view subscription events" 
ON public.subscription_events 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

-- RLS Policies for plan_changes
CREATE POLICY "Users can view their own plan changes" 
ON public.plan_changes 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.subscribers 
  WHERE subscribers.id = plan_changes.subscriber_id 
  AND subscribers.user_id = auth.uid()
));

CREATE POLICY "Edge functions can manage plan changes" 
ON public.plan_changes 
FOR ALL 
USING (true);

CREATE POLICY "Admins can view all plan changes" 
ON public.plan_changes 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

-- Create indexes for performance
CREATE INDEX idx_subscribers_user_id ON public.subscribers(user_id);
CREATE INDEX idx_subscribers_stripe_customer_id ON public.subscribers(stripe_customer_id);
CREATE INDEX idx_subscribers_email ON public.subscribers(email);
CREATE INDEX idx_payment_transactions_subscriber_id ON public.payment_transactions(subscriber_id);
CREATE INDEX idx_subscription_events_subscriber_id ON public.subscription_events(subscriber_id);
CREATE INDEX idx_subscription_events_stripe_event_id ON public.subscription_events(stripe_event_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscribers_updated_at
BEFORE UPDATE ON public.subscribers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, stripe_price_id, stripe_product_id, price, interval_type, features, is_popular) VALUES
('Starter', 'Perfect for small academies getting started', 'price_starter_monthly', 'prod_starter', 2900, 'month', '["Up to 50 students", "Basic reporting", "Email support", "Class scheduling"]'::jsonb, false),
('Professional', 'For growing academies with advanced needs', 'price_pro_monthly', 'prod_professional', 7900, 'month', '["Up to 200 students", "Advanced analytics", "Priority support", "Custom branding", "Payment processing", "Automated communications"]'::jsonb, true),
('Enterprise', 'For large academies with complex requirements', 'price_enterprise_monthly', 'prod_enterprise', 15900, 'month', '["Unlimited students", "White-label solution", "Dedicated support", "Custom integrations", "Advanced automation", "Multi-location support"]'::jsonb, false);

-- Create function to check subscription status
CREATE OR REPLACE FUNCTION public.check_subscription_access(required_tier TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_subscription_tier TEXT;
  is_active BOOLEAN;
BEGIN
  SELECT subscription_tier, (subscription_status = 'active' OR subscription_status = 'trialing')
  INTO user_subscription_tier, is_active
  FROM public.subscribers
  WHERE user_id = auth.uid();
  
  -- If no subscription found, check if it's a free tier requirement
  IF user_subscription_tier IS NULL THEN
    RETURN required_tier = 'free';
  END IF;
  
  -- If not active, deny access
  IF NOT is_active THEN
    RETURN false;
  END IF;
  
  -- Check tier hierarchy: Starter < Professional < Enterprise
  CASE required_tier
    WHEN 'free' THEN RETURN true;
    WHEN 'Starter' THEN RETURN user_subscription_tier IN ('Starter', 'Professional', 'Enterprise');
    WHEN 'Professional' THEN RETURN user_subscription_tier IN ('Professional', 'Enterprise');
    WHEN 'Enterprise' THEN RETURN user_subscription_tier = 'Enterprise';
    ELSE RETURN false;
  END CASE;
END;
$$;