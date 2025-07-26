-- Fix the payment schedule for the new membership subscription
-- Remove the extra payment since signup fee was already paid upfront
UPDATE payment_schedule 
SET total_installments = 11
WHERE membership_subscription_id = '9ac6847e-e6e1-44b5-9b40-169be06066c1';

-- Delete the last payment installment since it's not needed
-- (signup fee + first payment were paid upfront, so we only need 11 more payments)
DELETE FROM payment_schedule 
WHERE membership_subscription_id = '9ac6847e-e6e1-44b5-9b40-169be06066c1'
AND installment_number = 12;

-- Update installment numbers to reflect the correct sequence
UPDATE payment_schedule 
SET installment_number = installment_number - 1
WHERE membership_subscription_id = '9ac6847e-e6e1-44b5-9b40-169be06066c1'
AND installment_number > 1;