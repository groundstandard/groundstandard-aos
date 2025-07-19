-- Check and remove any existing role constraints
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS valid_roles;

ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the correct constraint for the new role system
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_roles 
CHECK (role IN ('owner', 'admin', 'staff', 'member', 'student', 'instructor'));

-- Now safely update admin to owner
UPDATE public.profiles 
SET role = 'owner' 
WHERE role = 'admin';

-- Create channel memberships table for private channel access control
CREATE TABLE IF NOT EXISTS public.channel_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  invited_by UUID REFERENCES public.profiles(id),
  UNIQUE(channel_id, user_id)
);

-- Enable RLS on channel memberships
ALTER TABLE public.channel_memberships ENABLE ROW LEVEL SECURITY;

-- RLS policies for channel_memberships
CREATE POLICY "Users can view their own channel memberships" 
ON public.channel_memberships 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Owners can manage all channel memberships" 
ON public.channel_memberships 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Users can be added to channels" 
ON public.channel_memberships 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
  OR user_id = auth.uid()
);

-- Update chat_channels RLS policies
DROP POLICY IF EXISTS "Admins can manage channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Users can view public channels" ON public.chat_channels;

CREATE POLICY "Owners can manage all channels" 
ON public.chat_channels 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Users can view accessible channels" 
ON public.chat_channels 
FOR SELECT 
USING (
  (type = 'public' AND auth.uid() IS NOT NULL)
  OR
  (type = 'private' AND EXISTS (
    SELECT 1 FROM public.channel_memberships 
    WHERE channel_id = chat_channels.id 
    AND user_id = auth.uid()
  ))
  OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Update chat_messages policies  
DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view channel messages" ON public.chat_messages;

CREATE POLICY "Users can send messages to accessible channels" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id 
  AND (
    (channel_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.chat_channels 
      WHERE id = chat_messages.channel_id 
      AND type = 'public'
    ))
    OR
    (channel_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.channel_memberships 
      WHERE channel_id = chat_messages.channel_id 
      AND user_id = auth.uid()
    ))
    OR
    (dm_channel_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.direct_message_channels 
      WHERE id = chat_messages.dm_channel_id 
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    ))
  )
);

CREATE POLICY "Users can view accessible channel messages" 
ON public.chat_messages 
FOR SELECT 
USING (
  (channel_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.chat_channels 
    WHERE id = chat_messages.channel_id 
    AND type = 'public'
  ))
  OR
  (channel_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.channel_memberships 
    WHERE channel_id = chat_messages.channel_id 
    AND user_id = auth.uid()
  ))
  OR
  (dm_channel_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.direct_message_channels 
    WHERE id = chat_messages.dm_channel_id 
    AND (user1_id = auth.uid() OR user2_id = auth.uid())
  ))
  OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);