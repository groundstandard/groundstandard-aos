-- Create table to store Stripe connected accounts
CREATE TABLE public.stripe_connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  account_status TEXT DEFAULT 'pending',
  charges_enabled BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  details_submitted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.stripe_connected_accounts ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own connected accounts
CREATE POLICY "select_own_connected_account" ON public.stripe_connected_accounts
FOR SELECT
USING (user_id = auth.uid());

-- Create policy for edge functions to manage connected accounts
CREATE POLICY "manage_connected_accounts" ON public.stripe_connected_accounts
FOR ALL
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_stripe_connected_accounts_updated_at
BEFORE UPDATE ON public.stripe_connected_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();