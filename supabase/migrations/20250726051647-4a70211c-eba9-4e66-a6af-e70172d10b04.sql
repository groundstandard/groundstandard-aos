-- Fix the function with correct column names
CREATE OR REPLACE FUNCTION public.generate_payment_schedule(subscription_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
        installment_number,
        total_installments,
        status
      ) VALUES (
        subscription_uuid,
        schedule_date,
        COALESCE(subscription_record.billing_amount_cents, subscription_record.base_price_cents),
        i,
        subscription_record.cycle_length_months,
        CASE WHEN i = 1 THEN 'paid' ELSE 'pending' END
      );
    END LOOP;
  END IF;
END;
$$;

-- Update the trigger function as well
CREATE OR REPLACE FUNCTION public.trigger_generate_payment_schedule()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Generate payment schedule after membership subscription is created
  PERFORM generate_payment_schedule(NEW.id);
  RETURN NEW;
END;
$$;