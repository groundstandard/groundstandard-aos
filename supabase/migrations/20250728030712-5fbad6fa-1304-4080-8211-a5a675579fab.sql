-- Add breakdown fields to billing_cycles table for payment display
ALTER TABLE billing_cycles 
ADD COLUMN setup_fee_cents INTEGER DEFAULT 0,
ADD COLUMN monthly_amount_cents INTEGER DEFAULT 0;