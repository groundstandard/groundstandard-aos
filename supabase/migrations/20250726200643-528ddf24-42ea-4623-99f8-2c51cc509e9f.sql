-- Fix the duplicate payment issue and correct numbering for membership subscription
-- Delete the duplicate pending payment 1 entry
DELETE FROM payment_schedule 
WHERE membership_subscription_id = '9ac6847e-e6e1-44b5-9b40-169be06066c1'
AND installment_number = 1
AND status = 'pending';

-- Update all payments to show total of 12 installments
UPDATE payment_schedule 
SET total_installments = 12
WHERE membership_subscription_id = '9ac6847e-e6e1-44b5-9b40-169be06066c1';

-- Renumber all payments starting from 2 to be 2-12 instead of 1-10
UPDATE payment_schedule 
SET installment_number = installment_number + 1
WHERE membership_subscription_id = '9ac6847e-e6e1-44b5-9b40-169be06066c1'
AND installment_number > 1;

-- Update the first payment note to be clearer
UPDATE payment_schedule 
SET notes = 'Payment 1 of 12: Monthly payment ($100) + Setup fee ($150)'
WHERE membership_subscription_id = '9ac6847e-e6e1-44b5-9b40-169be06066c1'
AND installment_number = 1;