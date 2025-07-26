-- Create payment_methods table for secure storage of payment method references
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'card' or 'ach'
  last4 TEXT,
  brand TEXT, -- for cards: visa, mastercard, etc.
  bank_name TEXT, -- for ACH
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payment_schedule table for tracking installment payments
CREATE TABLE public.payment_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_subscription_id UUID NOT NULL REFERENCES membership_subscriptions(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'past_due')),
  installment_number INTEGER NOT NULL,
  total_installments INTEGER NOT NULL,
  stripe_invoice_id TEXT,
  payment_method_id UUID REFERENCES payment_methods(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_schedule ENABLE ROW LEVEL SECURITY;

-- Create policies for payment_methods
CREATE POLICY "Users can view their own payment methods" 
ON public.payment_methods 
FOR SELECT 
USING (contact_id = auth.uid());

CREATE POLICY "Admin can view all payment methods" 
ON public.payment_methods 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'owner')
));

CREATE POLICY "Edge functions can manage payment methods" 
ON public.payment_methods 
FOR ALL 
USING (true);

-- Create policies for payment_schedule
CREATE POLICY "Users can view their own payment schedule" 
ON public.payment_schedule 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM membership_subscriptions ms
  WHERE ms.id = payment_schedule.membership_subscription_id
  AND ms.profile_id = auth.uid()
));

CREATE POLICY "Admin can view all payment schedules" 
ON public.payment_schedule 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'owner')
));

CREATE POLICY "Edge functions can manage payment schedules" 
ON public.payment_schedule 
FOR ALL 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_payment_methods_contact_id ON payment_methods(contact_id);
CREATE INDEX idx_payment_methods_stripe_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX idx_payment_schedule_membership_id ON payment_schedule(membership_subscription_id);
CREATE INDEX idx_payment_schedule_date ON payment_schedule(scheduled_date);
CREATE INDEX idx_payment_schedule_status ON payment_schedule(status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_methods_updated_at 
  BEFORE UPDATE ON payment_methods 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_schedule_updated_at 
  BEFORE UPDATE ON payment_schedule 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();