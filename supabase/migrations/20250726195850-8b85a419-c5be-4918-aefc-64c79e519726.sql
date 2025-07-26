-- Update the initial payment to show breakdown and fix the payment schedule

-- First, update the payment record to show the breakdown
UPDATE payments 
SET description = 'Membership: Monthly Payment ($100) + Setup Fee ($150)',
    subtotal_amount = 100.00,
    amount = 250.00
WHERE id = 'f5779d14-8a7c-45f6-a4da-37e3cdcaab7b';

-- Now fix the payment schedule - the first installment should be $250 to match the actual payment
UPDATE payment_schedule 
SET amount_cents = 25000,
    notes = 'Monthly payment ($100) + Setup fee ($150)'
WHERE membership_subscription_id = '9ac6847e-e6e1-44b5-9b40-169be06066c1'
AND installment_number = 1;

-- Add a column to track setup fees in payment schedule for better breakdown
ALTER TABLE payment_schedule 
ADD COLUMN IF NOT EXISTS setup_fee_cents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_amount_cents INTEGER DEFAULT 0;

-- Update the first payment to show the breakdown
UPDATE payment_schedule 
SET setup_fee_cents = 15000,
    monthly_amount_cents = 10000
WHERE membership_subscription_id = '9ac6847e-e6e1-44b5-9b40-169be06066c1'
AND installment_number = 1;

-- Update all other payments to show just monthly amount
UPDATE payment_schedule 
SET setup_fee_cents = 0,
    monthly_amount_cents = 10000
WHERE membership_subscription_id = '9ac6847e-e6e1-44b5-9b40-169be06066c1'
AND installment_number > 1;