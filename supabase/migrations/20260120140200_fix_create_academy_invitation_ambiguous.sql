-- Fix ambiguity in create_academy_invitation() where variable name conflicts with column name

CREATE OR REPLACE FUNCTION public.create_academy_invitation(
  academy_uuid uuid,
  invitee_email text,
  invitee_role text DEFAULT 'student'::text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_invitation_code TEXT;
  existing_invitation UUID;
BEGIN
  -- Check if user has permission to create invitations
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND academy_id = academy_uuid
    AND role IN ('owner', 'admin', 'staff')
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
    v_invitation_code := generate_invitation_code();
    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM academy_invitations ai
      WHERE ai.invitation_code = v_invitation_code
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
    v_invitation_code,
    auth.uid(),
    now() + INTERVAL '7 days'
  );

  RETURN v_invitation_code;
END;
$function$;
