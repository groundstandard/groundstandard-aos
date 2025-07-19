-- Create function to trigger HighLevel automations
CREATE OR REPLACE FUNCTION public.trigger_highlevel_automation()
RETURNS TRIGGER AS $$
DECLARE
  automation_type TEXT;
  contact_data JSONB;
BEGIN
  -- Determine automation type based on trigger context
  IF TG_TABLE_NAME = 'profiles' AND TG_OP = 'INSERT' THEN
    automation_type := 'member_signed';
    contact_data := jsonb_build_object(
      'membership_status', NEW.membership_status,
      'belt_level', NEW.belt_level,
      'join_date', NEW.created_at
    );
  ELSIF TG_TABLE_NAME = 'profiles' AND TG_OP = 'UPDATE' AND OLD.membership_status != NEW.membership_status THEN
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
    contact_data := jsonb_build_object(
      'class_id', NEW.class_id,
      'attendance_date', NEW.date,
      'status', NEW.status
    );
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Call the automation function asynchronously using pg_net extension
  PERFORM net.http_post(
    url := 'https://yhriiykdnpuutzexjdee.supabase.co/functions/v1/highlevel-automation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'type', automation_type,
      'contactId', COALESCE(NEW.id, NEW.student_id),
      'data', contact_data
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for different tables
CREATE TRIGGER highlevel_automation_profiles_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_highlevel_automation();

CREATE TRIGGER highlevel_automation_profiles_update
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_highlevel_automation();

CREATE TRIGGER highlevel_automation_payments
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_highlevel_automation();

CREATE TRIGGER highlevel_automation_attendance
  AFTER INSERT ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_highlevel_automation();

-- Create function to check for absent members (to be called by a scheduled job)
CREATE OR REPLACE FUNCTION public.check_absent_members()
RETURNS void AS $$
DECLARE
  absent_threshold INTEGER;
  absent_member RECORD;
BEGIN
  -- Get the absent days threshold from settings
  SELECT absent_days_threshold INTO absent_threshold
  FROM public.automation_settings
  LIMIT 1;

  IF absent_threshold IS NULL THEN
    absent_threshold := 7; -- Default to 7 days
  END IF;

  -- Find members who haven't attended in the threshold period
  FOR absent_member IN
    SELECT DISTINCT 
      p.id,
      p.first_name,
      p.last_name,
      p.email,
      MAX(a.date) as last_attendance,
      CURRENT_DATE - MAX(a.date) as days_absent
    FROM public.profiles p
    LEFT JOIN public.attendance a ON p.id = a.student_id
    WHERE p.membership_status = 'active'
    GROUP BY p.id, p.first_name, p.last_name, p.email
    HAVING (CURRENT_DATE - MAX(a.date)) >= absent_threshold
       OR MAX(a.date) IS NULL
  LOOP
    -- Call automation for each absent member
    PERFORM net.http_post(
      url := 'https://yhriiykdnpuutzexjdee.supabase.co/functions/v1/highlevel-automation',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'type', 'member_absent',
        'contactId', absent_member.id,
        'data', jsonb_build_object(
          'lastAttendance', absent_member.last_attendance,
          'daysAbsent', absent_member.days_absent
        )
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;