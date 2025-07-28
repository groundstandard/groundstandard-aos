-- Complete remaining database function security warnings fixes - Final Part

-- Fix remaining functions that still need SET search_path TO 'public'

-- Fix generate_invitation_code function
CREATE OR REPLACE FUNCTION public.generate_invitation_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars))::int + 1, 1);
  END LOOP;
  RETURN result;
END;
$function$;

-- Fix create_academy_invitation function
CREATE OR REPLACE FUNCTION public.create_academy_invitation(academy_uuid uuid, invitee_email text, invitee_role text DEFAULT 'student'::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  invitation_code TEXT;
  existing_invitation UUID;
BEGIN
  -- Check if user has permission to create invitations
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND academy_id = academy_uuid 
    AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to create invitations';
  END IF;

  -- Check if invitation already exists for this email and academy
  SELECT id INTO existing_invitation
  FROM academy_invitations
  WHERE academy_id = academy_uuid 
  AND email = invitee_email 
  AND status = 'pending';

  IF existing_invitation IS NOT NULL THEN
    RAISE EXCEPTION 'Invitation already exists for this email';
  END IF;

  -- Generate unique invitation code
  LOOP
    invitation_code := generate_invitation_code();
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM academy_invitations 
      WHERE invitation_code = invitation_code
    );
  END LOOP;

  -- Create the invitation
  INSERT INTO academy_invitations (
    academy_id,
    email,
    role,
    token,
    invitation_code,
    inviter_id,
    expires_at
  ) VALUES (
    academy_uuid,
    invitee_email,
    invitee_role,
    gen_random_uuid()::text,
    invitation_code,
    auth.uid(),
    now() + INTERVAL '7 days'
  );

  RETURN invitation_code;
END;
$function$;

-- Fix join_academy_with_code function
CREATE OR REPLACE FUNCTION public.join_academy_with_code(code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  invitation_record RECORD;
  academy_record RECORD;
BEGIN
  -- Find valid invitation
  SELECT * INTO invitation_record
  FROM academy_invitations
  WHERE invitation_code = UPPER(code)
  AND status = 'pending'
  AND expires_at > now();

  IF invitation_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired invitation code'
    );
  END IF;

  -- Get academy details
  SELECT * INTO academy_record
  FROM academies
  WHERE id = invitation_record.academy_id;

  -- Update user's profile to join academy
  UPDATE profiles 
  SET academy_id = invitation_record.academy_id,
      role = invitation_record.role,
      updated_at = now()
  WHERE id = auth.uid();

  -- Mark invitation as accepted
  UPDATE academy_invitations
  SET status = 'accepted',
      updated_at = now()
  WHERE id = invitation_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'academy_name', academy_record.name,
    'role', invitation_record.role
  );
END;
$function$;

-- Fix trigger_generate_payment_schedule function
CREATE OR REPLACE FUNCTION public.trigger_generate_payment_schedule()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Generate payment schedule after membership subscription is created
  PERFORM generate_payment_schedule(NEW.id);
  RETURN NEW;
END;
$function$;

-- Fix generate_payment_schedule function
CREATE OR REPLACE FUNCTION public.generate_payment_schedule(subscription_uuid uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Fix test_profile_access function
CREATE OR REPLACE FUNCTION public.test_profile_access()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid()
    );
$function$;

-- Fix user_has_academy_access function
CREATE OR REPLACE FUNCTION public.user_has_academy_access(target_academy_id uuid, target_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM academy_memberships
        WHERE user_id = target_user_id 
        AND academy_id = target_academy_id 
        AND is_active = true
    );
$function$;

-- Fix get_user_role_in_academy function
CREATE OR REPLACE FUNCTION public.get_user_role_in_academy(target_academy_id uuid, target_user_id uuid DEFAULT auth.uid())
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT COALESCE(
        (SELECT role
         FROM academy_memberships
         WHERE user_id = target_user_id 
         AND academy_id = target_academy_id 
         AND is_active = true),
        'none'
    );
$function$;