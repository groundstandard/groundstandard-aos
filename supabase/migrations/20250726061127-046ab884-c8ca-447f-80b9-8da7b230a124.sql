-- Add custom renewal rate columns to membership_subscriptions table
ALTER TABLE public.membership_subscriptions 
ADD COLUMN renewal_new_rate_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN renewal_new_rate_cents INTEGER DEFAULT NULL;

-- Add comment to explain the new columns
COMMENT ON COLUMN public.membership_subscriptions.renewal_new_rate_enabled IS 'Whether to use a custom renewal rate instead of discount percentage';
COMMENT ON COLUMN public.membership_subscriptions.renewal_new_rate_cents IS 'Fixed price in cents for renewal periods when renewal_new_rate_enabled is true';