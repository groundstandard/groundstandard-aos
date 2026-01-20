-- Allow reading invitation details by token (for pre-login invitation landing page)

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(invite_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  inv record;
  inv_json jsonb;
BEGIN
  IF invite_token IS NULL OR length(trim(invite_token)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Missing invitation token');
  END IF;

  SELECT ai.id,
         ai.email,
         ai.role,
         ai.status,
         ai.expires_at,
         a.id AS academy_id,
         a.name AS academy_name,
         a.description AS academy_description,
         p.first_name AS inviter_first_name,
         p.last_name AS inviter_last_name,
         p.email AS inviter_email
  INTO inv
  FROM public.academy_invitations ai
  JOIN public.academies a ON a.id = ai.academy_id
  LEFT JOIN public.profiles p ON p.id = ai.inviter_id
  WHERE ai.token = invite_token
  LIMIT 1;

  IF inv.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found');
  END IF;

  IF inv.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invitation has already been used or cancelled');
  END IF;

  IF inv.expires_at <= now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invitation has expired');
  END IF;

  inv_json := jsonb_build_object(
    'id', inv.id,
    'email', inv.email,
    'role', inv.role,
    'status', inv.status,
    'expires_at', inv.expires_at,
    'academy', jsonb_build_object(
      'id', inv.academy_id,
      'name', inv.academy_name,
      'description', inv.academy_description
    ),
    'inviter', jsonb_build_object(
      'first_name', inv.inviter_first_name,
      'last_name', inv.inviter_last_name,
      'email', inv.inviter_email
    )
  );

  RETURN jsonb_build_object('success', true, 'invitation', inv_json);
END;
$$;
