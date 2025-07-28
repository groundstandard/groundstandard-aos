-- Final 7 database function security warnings fixes

-- Fix remaining functions with search path issues

-- Fix generate_invoice_number function
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  year_part TEXT;
  sequence_part TEXT;
  next_number INTEGER;
BEGIN
  year_part := to_char(now(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 6) AS INTEGER)), 0) + 1
  INTO next_number
  FROM invoices
  WHERE invoice_number LIKE year_part || '-%';
  
  sequence_part := LPAD(next_number::TEXT, 4, '0');
  
  RETURN year_part || '-' || sequence_part;
END;
$function$;

-- Fix set_invoice_number function
CREATE OR REPLACE FUNCTION public.set_invoice_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix log_contact_activity function
CREATE OR REPLACE FUNCTION public.log_contact_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Log payment activities
  IF TG_TABLE_NAME = 'payments' AND TG_OP = 'INSERT' THEN
    INSERT INTO contact_activities (
      contact_id, 
      activity_type, 
      activity_title, 
      activity_description,
      activity_data
    ) VALUES (
      NEW.student_id,
      'payment',
      'Payment Received',
      'Payment of $' || (NEW.amount / 100.0) || ' received',
      jsonb_build_object(
        'amount', NEW.amount,
        'payment_method', NEW.payment_method,
        'description', NEW.description
      )
    );
  END IF;

  -- Log attendance activities
  IF TG_TABLE_NAME = 'attendance' AND TG_OP = 'INSERT' THEN
    INSERT INTO contact_activities (
      contact_id,
      activity_type,
      activity_title,
      activity_description,
      activity_data
    ) VALUES (
      NEW.student_id,
      'attendance',
      'Class Attendance',
      'Marked ' || NEW.status || ' for class on ' || NEW.date,
      jsonb_build_object(
        'status', NEW.status,
        'date', NEW.date,
        'notes', NEW.notes
      )
    );
  END IF;

  -- Log belt test activities
  IF TG_TABLE_NAME = 'belt_tests' AND TG_OP = 'INSERT' THEN
    INSERT INTO contact_activities (
      contact_id,
      activity_type,
      activity_title,
      activity_description,
      activity_data
    ) VALUES (
      NEW.student_id,
      'belt_test',
      'Belt Test Scheduled',
      'Belt test from ' || NEW.current_belt || ' to ' || NEW.target_belt || ' scheduled for ' || NEW.test_date,
      jsonb_build_object(
        'current_belt', NEW.current_belt,
        'target_belt', NEW.target_belt,
        'test_date', NEW.test_date,
        'status', NEW.status
      )
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Fix calculate_late_fees function
CREATE OR REPLACE FUNCTION public.calculate_late_fees()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert late fees for overdue payments
  INSERT INTO late_fees (payment_id, student_id, original_amount, late_fee_amount, days_overdue, fee_percentage)
  SELECT 
    p.id,
    p.student_id,
    p.amount,
    GREATEST(p.amount * 0.05, 500), -- 5% late fee, minimum $5
    EXTRACT(days FROM (now() - p.payment_date))::INTEGER,
    5.0
  FROM payments p
  WHERE p.status = 'pending'
    AND p.payment_date < (now() - INTERVAL '7 days')
    AND NOT EXISTS (
      SELECT 1 FROM late_fees lf 
      WHERE lf.payment_id = p.id
    );
END;
$function$;

-- Fix update_payment_analytics function
CREATE OR REPLACE FUNCTION public.update_payment_analytics(start_date date, end_date date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  total_rev INTEGER;
  total_pay INTEGER;
  success_pay INTEGER;
  fail_pay INTEGER;
  refund_amt INTEGER;
  outstanding_amt INTEGER;
  avg_payment INTEGER;
  conversion_rate DECIMAL(5,2);
BEGIN
  -- Calculate analytics for the period
  SELECT 
    COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0),
    COUNT(*),
    COUNT(CASE WHEN status = 'completed' THEN 1 END),
    COUNT(CASE WHEN status = 'failed' THEN 1 END),
    COALESCE(SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0),
    COALESCE(AVG(CASE WHEN status = 'completed' THEN amount END), 0)
  INTO total_rev, total_pay, success_pay, fail_pay, refund_amt, outstanding_amt, avg_payment
  FROM payments
  WHERE payment_date::DATE BETWEEN start_date AND end_date;

  -- Calculate conversion rate
  conversion_rate := CASE 
    WHEN total_pay > 0 THEN (success_pay::DECIMAL / total_pay) * 100
    ELSE 0
  END;

  -- Insert or update analytics record
  INSERT INTO payment_analytics (
    period_start, period_end, total_revenue, total_payments,
    successful_payments, failed_payments, refunded_amount,
    outstanding_amount, average_payment_value, payment_conversion_rate
  ) VALUES (
    start_date, end_date, total_rev, total_pay,
    success_pay, fail_pay, refund_amt,
    outstanding_amt, avg_payment, conversion_rate
  )
  ON CONFLICT (period_start, period_end) 
  DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    total_payments = EXCLUDED.total_payments,
    successful_payments = EXCLUDED.successful_payments,
    failed_payments = EXCLUDED.failed_payments,
    refunded_amount = EXCLUDED.refunded_amount,
    outstanding_amount = EXCLUDED.outstanding_amount,
    average_payment_value = EXCLUDED.average_payment_value,
    payment_conversion_rate = EXCLUDED.payment_conversion_rate;
END;
$function$;

-- Fix create_next_billing_cycle function
CREATE OR REPLACE FUNCTION public.create_next_billing_cycle(subscription_uuid uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  subscription_record RECORD;
  new_cycle_id UUID;
  cycle_start DATE;
  cycle_end DATE;
BEGIN
  -- Get subscription details
  SELECT ms.*, mp.billing_frequency, mp.price_cents
  INTO subscription_record
  FROM membership_subscriptions ms
  JOIN membership_plans mp ON ms.membership_plan_id = mp.id
  WHERE ms.id = subscription_uuid;

  IF subscription_record IS NULL THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;

  -- Calculate cycle dates
  cycle_start := subscription_record.next_billing_date;
  
  CASE subscription_record.billing_frequency
    WHEN 'weekly' THEN cycle_end := cycle_start + INTERVAL '7 days';
    WHEN 'monthly' THEN cycle_end := cycle_start + INTERVAL '1 month';
    WHEN 'quarterly' THEN cycle_end := cycle_start + INTERVAL '3 months';
    WHEN 'annually' THEN cycle_end := cycle_start + INTERVAL '1 year';
    ELSE cycle_end := cycle_start + INTERVAL '1 month';
  END CASE;

  -- Create billing cycle
  INSERT INTO billing_cycles (
    membership_subscription_id,
    cycle_start_date,
    cycle_end_date,
    amount_cents,
    discount_applied_cents,
    total_amount_cents,
    due_date
  ) VALUES (
    subscription_uuid,
    cycle_start,
    cycle_end,
    COALESCE(subscription_record.billing_amount_cents, subscription_record.price_cents),
    (COALESCE(subscription_record.billing_amount_cents, subscription_record.price_cents) * subscription_record.discount_percentage / 100)::INTEGER,
    COALESCE(subscription_record.billing_amount_cents, subscription_record.price_cents) - (COALESCE(subscription_record.billing_amount_cents, subscription_record.price_cents) * subscription_record.discount_percentage / 100)::INTEGER,
    cycle_start
  ) RETURNING id INTO new_cycle_id;

  -- Update next billing date
  UPDATE membership_subscriptions 
  SET next_billing_date = cycle_end 
  WHERE id = subscription_uuid;

  RETURN new_cycle_id;
END;
$function$;

-- Fix audit_role_changes function
CREATE OR REPLACE FUNCTION public.audit_role_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only log role changes, and only for UPDATE operations
  IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (
      auth.uid(),
      'role_change',
      'profiles',
      NEW.id,
      jsonb_build_object('role', OLD.role),
      jsonb_build_object('role', NEW.role)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;