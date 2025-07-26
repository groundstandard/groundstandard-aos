-- Add signup fee functionality to membership plans and payment schedules
ALTER TABLE membership_plans 
ADD COLUMN signup_fee_cents INTEGER DEFAULT 0;

-- Add payment type to distinguish signup fees from recurring payments
ALTER TABLE payment_schedule
ADD COLUMN payment_type TEXT DEFAULT 'recurring' CHECK (payment_type IN ('signup_fee', 'recurring', 'freeze_compensation'));

-- Update existing records to have the correct payment type
UPDATE payment_schedule 
SET payment_type = 'signup_fee' 
WHERE installment_number = 1 AND EXISTS (
  SELECT 1 FROM membership_plans mp 
  JOIN membership_subscriptions ms ON mp.id = ms.membership_plan_id
  WHERE ms.id = payment_schedule.membership_subscription_id 
  AND mp.signup_fee_cents > 0
);

-- Create index for better performance
CREATE INDEX idx_payment_schedule_payment_type ON payment_schedule(payment_type);