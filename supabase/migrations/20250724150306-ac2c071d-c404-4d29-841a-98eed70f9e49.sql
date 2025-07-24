-- Fix membership_plans table structure to align with Stripe integration
-- The main issue is using 'base_price_cents' instead of 'price_cents' in the edge functions

-- Add missing columns for better Stripe integration
ALTER TABLE public.membership_plans 
ADD COLUMN IF NOT EXISTS stripe_product_id text,
ADD COLUMN IF NOT EXISTS price_cents integer;

-- Update price_cents to match base_price_cents for existing records
UPDATE public.membership_plans 
SET price_cents = base_price_cents 
WHERE price_cents IS NULL;

-- Create a function to keep price_cents in sync with base_price_cents
CREATE OR REPLACE FUNCTION sync_membership_plan_prices()
RETURNS TRIGGER AS $$
BEGIN
  -- Keep price_cents in sync with base_price_cents
  NEW.price_cents = NEW.base_price_cents;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain price consistency
DROP TRIGGER IF EXISTS sync_membership_plan_prices_trigger ON public.membership_plans;
CREATE TRIGGER sync_membership_plan_prices_trigger
  BEFORE INSERT OR UPDATE ON public.membership_plans
  FOR EACH ROW
  EXECUTE FUNCTION sync_membership_plan_prices();