-- Fix the new membership's first payment to show proper breakdown
-- Update the first payment to show $350 total with setup fee breakdown
UPDATE payment_schedule 
SET amount_cents = 35000,
    setup_fee_cents = 15000,
    monthly_amount_cents = 20000,
    notes = 'Payment 1 of 12: Monthly payment ($200) + Setup fee ($150)'
WHERE membership_subscription_id = '60d06d19-0b42-4f72-979f-11a59707cc8d'
AND installment_number = 1;

-- Update all other payments to show just the monthly amount
UPDATE payment_schedule 
SET monthly_amount_cents = 20000,
    setup_fee_cents = 0
WHERE membership_subscription_id = '60d06d19-0b42-4f72-979f-11a59707cc8d'
AND installment_number > 1;