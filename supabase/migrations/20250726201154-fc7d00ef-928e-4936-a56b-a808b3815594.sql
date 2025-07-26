-- Fix the missing Payment 2 and Payment 12 by renumbering correctly
-- First, renumber all payments after 1 to be sequential (2-11)
UPDATE payment_schedule 
SET installment_number = installment_number - 1
WHERE membership_subscription_id = '9ac6847e-e6e1-44b5-9b40-169be06066c1'
AND installment_number > 1;

-- Add the missing 12th payment (Payment 12 of 12)
INSERT INTO payment_schedule (
  membership_subscription_id,
  scheduled_date,
  amount_cents,
  installment_number,
  total_installments,
  status,
  payment_type,
  monthly_amount_cents,
  setup_fee_cents
) VALUES (
  '9ac6847e-e6e1-44b5-9b40-169be06066c1',
  '2026-06-26',
  10000,
  12,
  12,
  'pending',
  'recurring',
  10000,
  0
);