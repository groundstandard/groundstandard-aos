-- Insert sample payment history for contact Bobby Freda
INSERT INTO payments (
  student_id,
  amount,
  payment_method,
  status,
  description,
  payment_date,
  stripe_payment_intent_id,
  created_at,
  updated_at
) VALUES 
-- Recent 1 Class payment
(
  '8d34716f-092c-42ed-af18-5d70dee50441',
  9900,
  'card',
  'completed',
  '1 Class - Monthly Subscription',
  '2025-01-22 15:30:00+00',
  'pi_test_' || substr(md5(random()::text), 1, 24),
  '2025-01-22 15:30:00+00',
  '2025-01-22 15:30:00+00'
),
-- Previous Premium Annual payment
(
  '8d34716f-092c-42ed-af18-5d70dee50441',
  149000,
  'card',
  'completed',
  'Premium Annual Plan - Annual Subscription',
  '2024-07-18 10:00:00+00',
  'pi_test_' || substr(md5(random()::text), 1, 24),
  '2024-07-18 10:00:00+00',
  '2024-07-18 10:00:00+00'
),
-- Basic plan upgrade payment
(
  '8d34716f-092c-42ed-af18-5d70dee50441',
  99000,
  'card',
  'completed',
  'Basic Annual Plan - Annual Subscription',
  '2024-12-15 14:20:00+00',
  'pi_test_' || substr(md5(random()::text), 1, 24),
  '2024-12-15 14:20:00+00',
  '2024-12-15 14:20:00+00'
);

-- Create a membership subscription record for the current active subscription
INSERT INTO membership_subscriptions (
  profile_id,
  membership_plan_id,
  status,
  start_date,
  end_date,
  next_billing_date,
  billing_frequency,
  billing_amount_cents,
  auto_renewal,
  created_at,
  updated_at
) VALUES (
  '8d34716f-092c-42ed-af18-5d70dee50441',
  '4463db7a-6a34-4c9f-9118-b420e8d19660', -- 1 Class plan
  'active',
  '2025-01-22',
  null,
  '2025-02-22',
  'monthly',
  9900,
  true,
  '2025-01-22 15:30:00+00',
  '2025-01-22 15:30:00+00'
);