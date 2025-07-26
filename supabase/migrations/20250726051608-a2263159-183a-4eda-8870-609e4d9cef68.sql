-- Create function to generate payment schedules for memberships
CREATE OR REPLACE FUNCTION public.generate_payment_schedule(subscription_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscription_record RECORD;
  schedule_date DATE;
  i INTEGER;
BEGIN
  -- Get subscription and plan details
  SELECT ms.*, mp.cycle_length_months, mp.billing_frequency, mp.base_price_cents
  INTO subscription_record
  FROM membership_subscriptions ms
  JOIN membership_plans mp ON ms.membership_plan_id = mp.id
  WHERE ms.id = subscription_uuid;

  IF subscription_record IS NULL THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;

  -- Only generate schedules for plans with multiple payment cycles
  IF subscription_record.cycle_length_months > 1 AND subscription_record.billing_frequency = 'monthly' THEN
    -- Generate payment schedule for each month
    FOR i IN 1..subscription_record.cycle_length_months LOOP
      -- Calculate payment date (start date + i-1 months)
      schedule_date := subscription_record.start_date + (i - 1) * INTERVAL '1 month';
      
      -- Insert payment schedule entry
      INSERT INTO payment_schedule (
        membership_subscription_id,
        scheduled_date,
        amount_cents,
        payment_number,
        total_payments,
        status,
        description
      ) VALUES (
        subscription_uuid,
        schedule_date,
        COALESCE(subscription_record.billing_amount_cents, subscription_record.base_price_cents),
        i,
        subscription_record.cycle_length_months,
        CASE WHEN i = 1 THEN 'paid' ELSE 'pending' END, -- First payment is immediate
        'Payment ' || i || ' of ' || subscription_record.cycle_length_months
      );
    END LOOP;
  END IF;
END;
$$;

-- Create trigger to automatically generate payment schedules when membership is created
CREATE OR REPLACE FUNCTION public.trigger_generate_payment_schedule()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Generate payment schedule after membership subscription is created
  PERFORM generate_payment_schedule(NEW.id);
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS after_membership_subscription_insert ON membership_subscriptions;

-- Create trigger
CREATE TRIGGER after_membership_subscription_insert
  AFTER INSERT ON membership_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_payment_schedule();