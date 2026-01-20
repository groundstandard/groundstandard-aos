-- Fix join_academy_with_code to properly onboard invited users
-- - Enforces invitation email match
-- - Creates/updates profile row
-- - Ensures academy_memberships exists
-- - Sets last_academy_id for academy loading

CREATE OR REPLACE FUNCTION public.join_academy_with_code(code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  invitation_record RECORD;
  academy_name text;
  current_email text;
  username_part text;
BEGIN
  IF code IS NULL OR length(trim(code)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Missing invitation code');
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT email INTO current_email
  FROM auth.users
  WHERE id = auth.uid()
  LIMIT 1;

  IF current_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Find valid invitation
  SELECT *
  INTO invitation_record
  FROM public.academy_invitations
  WHERE invitation_code = upper(trim(code))
    AND status = 'pending'
    AND expires_at > now();

  IF invitation_record.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation code');
  END IF;

  IF lower(invitation_record.email) <> lower(current_email) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation email mismatch');
  END IF;

  SELECT name
  INTO academy_name
  FROM public.academies
  WHERE id = invitation_record.academy_id;

  IF academy_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Academy not found');
  END IF;

  username_part := split_part(current_email, '@', 1);

  -- Create or update profile
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    academy_id,
    last_academy_id,
    updated_at
  ) VALUES (
    auth.uid(),
    current_email,
    COALESCE(NULLIF(username_part, ''), 'Student'),
    'Student',
    invitation_record.role,
    invitation_record.academy_id,
    invitation_record.academy_id,
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      first_name = COALESCE(public.profiles.first_name, EXCLUDED.first_name),
      last_name = COALESCE(public.profiles.last_name, EXCLUDED.last_name),
      role = EXCLUDED.role,
      academy_id = EXCLUDED.academy_id,
      last_academy_id = EXCLUDED.last_academy_id,
      updated_at = now();

  -- Ensure membership exists
  UPDATE public.academy_memberships
  SET role = invitation_record.role,
      is_active = true
  WHERE user_id = auth.uid()
    AND academy_id = invitation_record.academy_id;

  IF NOT FOUND THEN
    INSERT INTO public.academy_memberships (user_id, academy_id, role, is_active)
    VALUES (auth.uid(), invitation_record.academy_id, invitation_record.role, true);
  END IF;

  -- Mark invitation as accepted
  UPDATE public.academy_invitations
  SET status = 'accepted',
      updated_at = now()
  WHERE id = invitation_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'academy_id', invitation_record.academy_id,
    'academy_name', academy_name,
    'role', invitation_record.role
  );
END;
$$;

REVOKE ALL ON FUNCTION public.join_academy_with_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_academy_with_code(text) TO authenticated;
