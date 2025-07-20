-- Ensure academy_invitations table exists with proper structure
CREATE TABLE IF NOT EXISTS public.academy_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.academy_invitations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Academy members can view invitations for their academy" 
ON public.academy_invitations 
FOR SELECT 
USING (
  academy_id IN (
    SELECT academy_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Academy admins can insert invitations" 
ON public.academy_invitations 
FOR INSERT 
WITH CHECK (
  academy_id IN (
    SELECT p.academy_id 
    FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Academy admins can update invitations" 
ON public.academy_invitations 
FOR UPDATE 
USING (
  academy_id IN (
    SELECT p.academy_id 
    FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('owner', 'admin')
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_academy_invitations_academy_id ON public.academy_invitations(academy_id);
CREATE INDEX IF NOT EXISTS idx_academy_invitations_email ON public.academy_invitations(email);
CREATE INDEX IF NOT EXISTS idx_academy_invitations_token ON public.academy_invitations(token);
CREATE INDEX IF NOT EXISTS idx_academy_invitations_status ON public.academy_invitations(status);

-- Create trigger for updated_at
CREATE OR REPLACE TRIGGER update_academy_invitations_updated_at
BEFORE UPDATE ON public.academy_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();