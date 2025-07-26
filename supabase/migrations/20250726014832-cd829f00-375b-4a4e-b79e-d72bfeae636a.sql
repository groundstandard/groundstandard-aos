-- Add Stripe Connect support to academies table for proper multi-tenancy
ALTER TABLE public.academies 
ADD COLUMN stripe_connect_account_id TEXT,
ADD COLUMN stripe_onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN stripe_charges_enabled BOOLEAN DEFAULT false,
ADD COLUMN stripe_payouts_enabled BOOLEAN DEFAULT false;

-- Update stripe_connected_accounts to link to academies
ALTER TABLE public.stripe_connected_accounts 
ADD COLUMN academy_id UUID REFERENCES public.academies(id);

-- Create index for performance
CREATE INDEX idx_academies_stripe_connect ON public.academies(stripe_connect_account_id);
CREATE INDEX idx_stripe_connected_accounts_academy ON public.stripe_connected_accounts(academy_id);

-- Add RLS policy for stripe connected accounts
CREATE POLICY "Academy owners can manage their stripe accounts" ON public.stripe_connected_accounts
FOR ALL
USING (academy_id IN (
  SELECT id FROM public.academies WHERE owner_id = auth.uid()
));