-- Enable users to join academies through invitation codes
-- Add invitation code support to academy_invitations table
ALTER TABLE public.academy_invitations 
ADD COLUMN IF NOT EXISTS invitation_code TEXT UNIQUE;

-- Create function to generate unique invitation codes
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql;

-- Create function to create academy invitation with code
CREATE OR REPLACE FUNCTION public.create_academy_invitation(
  academy_uuid UUID,
  invitee_email TEXT,
  invitee_role TEXT DEFAULT 'student'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Create function to join academy with invitation code
CREATE OR REPLACE FUNCTION public.join_academy_with_code(code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;