-- Add the missing Payment 11 of 12
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
  '2026-05-26',
  10000,
  11,
  12,
  'pending',
  'recurring',
  10000,
  0
);

-- Update Payment 12 date to be correct (should be one month after Payment 11)
UPDATE payment_schedule 
SET scheduled_date = '2026-06-26'
WHERE membership_subscription_id = '9ac6847e-e6e1-44b5-9b40-169be06066c1'
AND installment_number = 12;