-- Accept invitation server-side + allow invitee to view invitation

-- Helper: get current auth user's email safely
CREATE OR REPLACE FUNCTION public.get_auth_email()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1;
$$;

-- Allow invitee to view their own invitation after they sign in (by matching email)
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Invitee can view their invitation" 
    ON public.academy_invitations
    FOR SELECT
    USING (public.get_auth_email() = email);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- Accept invitation using token (server-side enforcement)
CREATE OR REPLACE FUNCTION public.accept_invitation_token(invite_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  inv record;
  current_email text;
BEGIN
  IF invite_token IS NULL OR length(trim(invite_token)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Missing invitation token');
  END IF;

  current_email := public.get_auth_email();
  IF current_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT *
  INTO inv
  FROM public.academy_invitations
  WHERE token = invite_token
    AND status = 'pending'
    AND expires_at > now();

  IF inv.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  IF lower(inv.email) <> lower(current_email) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation email mismatch');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.academies a WHERE a.id = inv.academy_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Academy not found');
  END IF;

  -- Update user's profile
  UPDATE public.profiles
  SET academy_id = inv.academy_id,
      last_academy_id = inv.academy_id,
      role = inv.role,
      updated_at = now()
  WHERE id = auth.uid();

  -- Ensure membership exists/updated
  INSERT INTO public.academy_memberships (user_id, academy_id, role, is_active)
  VALUES (auth.uid(), inv.academy_id, inv.role, true)
  ON CONFLICT (user_id, academy_id) DO UPDATE
    SET role = EXCLUDED.role,
        is_active = true;

  -- Mark invitation accepted
  UPDATE public.academy_invitations
  SET status = 'accepted',
      updated_at = now()
  WHERE id = inv.id;

  RETURN jsonb_build_object('success', true, 'academy_id', inv.academy_id, 'role', inv.role);
END;
$$;
