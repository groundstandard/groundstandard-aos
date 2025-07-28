-- Continue fixing database function security warnings - Part 3

-- Fix verify_location_check_in function
CREATE OR REPLACE FUNCTION public.verify_location_check_in(user_latitude numeric, user_longitude numeric, academy_location_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  location_record RECORD;
  distance_meters DECIMAL;
BEGIN
  -- Get academy location details
  SELECT latitude, longitude, check_in_radius_meters
  INTO location_record
  FROM academy_locations
  WHERE id = academy_location_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Calculate distance using Haversine formula (simplified)
  -- This is a basic implementation - for production, consider using PostGIS
  distance_meters := (
    6371000 * acos(
      cos(radians(location_record.latitude)) * 
      cos(radians(user_latitude)) * 
      cos(radians(user_longitude) - radians(location_record.longitude)) + 
      sin(radians(location_record.latitude)) * 
      sin(radians(user_latitude))
    )
  );
  
  RETURN distance_meters <= location_record.check_in_radius_meters;
END;
$function$;

-- Fix get_contact_class_access function
CREATE OR REPLACE FUNCTION public.get_contact_class_access(contact_uuid uuid)
 RETURNS TABLE(class_id uuid, class_name text, access_type text, additional_fee_cents integer, max_sessions_per_period integer, period_type text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    c.id as class_id,
    c.name as class_name,
    COALESCE(cap.access_type, 'restricted') as access_type,
    COALESCE(cap.additional_fee_cents, 0) as additional_fee_cents,
    cap.max_sessions_per_period,
    cap.period_type
  FROM classes c
  LEFT JOIN class_access_permissions cap ON c.id = cap.class_id
  LEFT JOIN membership_subscriptions ms ON cap.membership_plan_id = ms.membership_plan_id
  WHERE c.is_active = true
  AND (ms.profile_id = contact_uuid AND ms.status = 'active')
  OR cap.access_type = 'additional_fee'
  ORDER BY c.name;
$function$;

-- Fix get_family_members function
CREATE OR REPLACE FUNCTION public.get_family_members(contact_uuid uuid)
 RETURNS TABLE(contact_id uuid, first_name text, last_name text, email text, relationship_type text, is_emergency_contact boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.id as contact_id,
    p.first_name,
    p.last_name,
    p.email,
    fr.relationship_type,
    fr.is_emergency_contact
  FROM family_relationships fr
  JOIN profiles p ON (
    (fr.primary_contact_id = contact_uuid AND p.id = fr.related_contact_id) OR
    (fr.related_contact_id = contact_uuid AND p.id = fr.primary_contact_id)
  )
  WHERE fr.primary_contact_id = contact_uuid OR fr.related_contact_id = contact_uuid
  ORDER BY fr.is_emergency_contact DESC, p.first_name;
$function$;

-- Fix process_expired_class_packs function
CREATE OR REPLACE FUNCTION public.process_expired_class_packs()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Mark expired class packs
    UPDATE class_packs 
    SET status = 'expired',
        updated_at = now()
    WHERE expiry_date < CURRENT_DATE 
    AND status = 'active';
    
    -- Auto-renew class packs that have auto_renewal enabled and are nearly exhausted or expired
    INSERT INTO class_packs (
        profile_id,
        membership_plan_id,
        total_classes,
        remaining_classes,
        expiry_date,
        status,
        auto_renewal,
        renewal_discount_percentage,
        notes
    )
    SELECT 
        cp.profile_id,
        cp.membership_plan_id,
        mp.class_pack_size,
        mp.class_pack_size,
        CURRENT_DATE + INTERVAL '1 day' * mp.pack_expiry_days,
        'pending_payment',
        cp.auto_renewal,
        cp.renewal_discount_percentage,
        'Auto-renewal from pack ID: ' || cp.id
    FROM class_packs cp
    JOIN membership_plans mp ON cp.membership_plan_id = mp.id
    WHERE cp.auto_renewal = true
    AND cp.status = 'active'
    AND (
        cp.expiry_date <= CURRENT_DATE + INTERVAL '7 days' -- Expiring within 7 days
        OR cp.remaining_classes <= 2 -- 2 or fewer classes remaining
    )
    AND NOT EXISTS (
        -- Don't create duplicate renewals
        SELECT 1 FROM class_packs cp2 
        WHERE cp2.profile_id = cp.profile_id 
        AND cp2.membership_plan_id = cp.membership_plan_id
        AND cp2.status = 'pending_payment'
        AND cp2.notes LIKE '%Auto-renewal from pack ID: ' || cp.id || '%'
    );
END;
$function$;

-- Fix generate_check_in_pin function
CREATE OR REPLACE FUNCTION public.generate_check_in_pin()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_pin TEXT;
  pin_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 4-digit PIN
    new_pin := LPAD((RANDOM() * 9999)::INTEGER::TEXT, 4, '0');
    
    -- Check if PIN already exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE check_in_pin = new_pin) INTO pin_exists;
    
    -- If PIN doesn't exist, we can use it
    IF NOT pin_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_pin;
END;
$function$;