-- Fix the trigger function to handle different table contexts properly
CREATE OR REPLACE FUNCTION public.trigger_highlevel_automation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  automation_type TEXT;
  contact_data JSONB;
  contact_id UUID;
BEGIN
  -- Determine automation type and contact ID based on trigger context
  IF TG_TABLE_NAME = 'profiles' AND TG_OP = 'INSERT' THEN
    automation_type := 'member_signed';
    contact_id := NEW.id;
    contact_data := jsonb_build_object(
      'membership_status', NEW.membership_status,
      'belt_level', NEW.belt_level,
      'join_date', NEW.created_at
    );
  ELSIF TG_TABLE_NAME = 'profiles' AND TG_OP = 'UPDATE' AND OLD.membership_status != NEW.membership_status THEN
    contact_id := NEW.id;
    IF NEW.membership_status = 'cancelled' THEN
      automation_type := 'member_cancelled';
    ELSIF NEW.membership_status = 'active' AND OLD.membership_status = 'cancelled' THEN
      automation_type := 'member_current';
    ELSE
      RETURN COALESCE(NEW, OLD);
    END IF;
    contact_data := jsonb_build_object(
      'old_status', OLD.membership_status,
      'new_status', NEW.membership_status,
      'changed_at', now()
    );
  ELSIF TG_TABLE_NAME = 'payments' AND TG_OP = 'INSERT' THEN
    contact_id := NEW.student_id;
    IF NEW.status = 'failed' THEN
      automation_type := 'member_delinquent';
      contact_data := jsonb_build_object(
        'amount_due', NEW.amount,
        'payment_method', NEW.payment_method,
        'failure_reason', NEW.description
      );
    ELSIF NEW.status = 'completed' THEN
      automation_type := 'member_current';
      contact_data := jsonb_build_object(
        'amount_paid', NEW.amount,
        'payment_method', NEW.payment_method,
        'payment_date', NEW.payment_date
      );
    ELSE
      RETURN COALESCE(NEW, OLD);
    END IF;
  ELSIF TG_TABLE_NAME = 'attendance' AND TG_OP = 'INSERT' THEN
    automation_type := 'member_present';
    contact_id := NEW.student_id;
    contact_data := jsonb_build_object(
      'class_id', NEW.class_id,
      'attendance_date', NEW.date,
      'status', NEW.status
    );
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Only proceed if we have a valid contact_id
  IF contact_id IS NOT NULL THEN
    -- Call the automation function asynchronously using pg_net extension
    PERFORM net.http_post(
      url := 'https://yhriiykdnpuutzexjdee.supabase.co/functions/v1/highlevel-automation',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'type', automation_type,
        'contactId', contact_id,
        'data', contact_data
      )
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;