-- Create membership_freezes table for freeze functionality
CREATE TABLE public.membership_freezes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  membership_subscription_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  frozen_amount_cents INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.membership_freezes ENABLE ROW LEVEL SECURITY;

-- Create policies for membership_freezes
CREATE POLICY "Academy members can view freezes for their academy" 
ON public.membership_freezes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM membership_subscriptions ms
    JOIN academy_memberships am1 ON ms.profile_id = am1.user_id
    JOIN academy_memberships am2 ON am1.academy_id = am2.academy_id
    WHERE ms.id = membership_freezes.membership_subscription_id
    AND am2.user_id = auth.uid()
    AND am1.is_active = true
    AND am2.is_active = true
  )
);

CREATE POLICY "Admins can manage freezes" 
ON public.membership_freezes 
FOR ALL 
USING (
  get_current_user_role() = ANY (ARRAY['admin', 'owner'])
);

-- Add trigger for updated_at
CREATE TRIGGER update_membership_freezes_updated_at
BEFORE UPDATE ON public.membership_freezes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraint
ALTER TABLE public.membership_freezes
ADD CONSTRAINT fk_membership_freezes_subscription
FOREIGN KEY (membership_subscription_id)
REFERENCES public.membership_subscriptions(id)
ON DELETE CASCADE;