-- Add missing columns to existing subscribers table
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid', 'paused')),
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;

-- Create payment transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
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
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES public.subscribers(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE,
  event_data JSONB,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

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

-- RLS Policies for subscription_events
CREATE POLICY "Edge functions can manage events" 
ON public.subscription_events 
FOR ALL 
USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_subscriber_id ON public.payment_transactions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_subscriber_id ON public.subscription_events(subscriber_id);

-- Create triggers for updated_at columns
CREATE OR REPLACE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

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
  
  -- If no subscription found, allow free tier
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