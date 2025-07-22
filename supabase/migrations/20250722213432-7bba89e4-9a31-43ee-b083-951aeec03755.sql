-- Add renewal settings to membership plans
ALTER TABLE membership_plans 
ADD COLUMN IF NOT EXISTS renewal_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS renewal_discount_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS renewal_new_rate_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS renewal_new_rate_cents INTEGER,
ADD COLUMN IF NOT EXISTS auto_renewal_default BOOLEAN DEFAULT false;