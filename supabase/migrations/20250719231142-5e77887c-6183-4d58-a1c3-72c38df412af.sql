-- Update profiles table to add role column with proper access levels
DO $$ 
BEGIN
  -- Check if role column exists and update it to use the new enum values
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
    -- First update any existing admin users to owner
    UPDATE public.profiles SET role = 'owner' WHERE role = 'admin';
    
    -- Add staff role as an option (this will be compatible with existing 'student' values)
    -- We'll keep 'student' as 'member' for backwards compatibility
    ALTER TABLE public.profiles 
    DROP CONSTRAINT IF EXISTS profiles_role_check;
    
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('owner', 'staff', 'member', 'student'));
  END IF;
END $$;

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

-- Allow users to view their own channel memberships
CREATE POLICY "Users can view their own channel memberships" 
ON public.channel_memberships 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow owners to manage all channel memberships
CREATE POLICY "Owners can manage all channel memberships" 
ON public.channel_memberships 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'owner' OR role = 'admin')
  )
);

-- Allow staff and members to be added to channels (but not add others)
CREATE POLICY "Users can be added to channels" 
ON public.channel_memberships 
FOR INSERT 
WITH CHECK (
  -- Owner can add anyone
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'owner' OR role = 'admin')
  )
  OR
  -- Or the user being added is the authenticated user (self-join for public channels)
  user_id = auth.uid()
);

-- Update chat_channels RLS policies to support the new role system
DROP POLICY IF EXISTS "Admins can manage channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Users can view public channels" ON public.chat_channels;

-- Owners can manage all channels
CREATE POLICY "Owners can manage all channels" 
ON public.chat_channels 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'owner' OR role = 'admin')
  )
);

-- Users can view public channels or private channels they're members of
CREATE POLICY "Users can view accessible channels" 
ON public.chat_channels 
FOR SELECT 
USING (
  -- Public channels are visible to all authenticated users
  (type = 'public' AND auth.uid() IS NOT NULL)
  OR
  -- Private channels are only visible to members
  (type = 'private' AND EXISTS (
    SELECT 1 FROM public.channel_memberships 
    WHERE channel_id = chat_channels.id 
    AND user_id = auth.uid()
  ))
  OR
  -- Owners can see all channels
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'owner' OR role = 'admin')
  )
);

-- Update chat_messages policies to work with new channel access control
DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view channel messages" ON public.chat_messages;

-- Users can send messages to channels they have access to
CREATE POLICY "Users can send messages to accessible channels" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id 
  AND (
    -- Can send to public channels
    (channel_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.chat_channels 
      WHERE id = chat_messages.channel_id 
      AND type = 'public'
    ))
    OR
    -- Can send to private channels they're members of
    (channel_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.channel_memberships 
      WHERE channel_id = chat_messages.channel_id 
      AND user_id = auth.uid()
    ))
    OR
    -- Can send DMs they're part of
    (dm_channel_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.direct_message_channels 
      WHERE id = chat_messages.dm_channel_id 
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    ))
  )
);

-- Users can view messages from channels they have access to
CREATE POLICY "Users can view accessible channel messages" 
ON public.chat_messages 
FOR SELECT 
USING (
  -- Can view public channel messages
  (channel_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.chat_channels 
    WHERE id = chat_messages.channel_id 
    AND type = 'public'
  ))
  OR
  -- Can view private channel messages they're members of
  (channel_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.channel_memberships 
    WHERE channel_id = chat_messages.channel_id 
    AND user_id = auth.uid()
  ))
  OR
  -- Can view DM messages they're part of
  (dm_channel_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.direct_message_channels 
    WHERE id = chat_messages.dm_channel_id 
    AND (user1_id = auth.uid() OR user2_id = auth.uid())
  ))
  OR
  -- Owners can see all messages
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'owner' OR role = 'admin')
  )
);

-- Create function to automatically add users to public channels when they're created
CREATE OR REPLACE FUNCTION add_user_to_public_channels()
RETURNS TRIGGER AS $$
BEGIN
  -- Add new users to all existing public channels
  INSERT INTO public.channel_memberships (channel_id, user_id)
  SELECT cc.id, NEW.id
  FROM public.chat_channels cc
  WHERE cc.type = 'public'
  AND NOT EXISTS (
    SELECT 1 FROM public.channel_memberships cm
    WHERE cm.channel_id = cc.id AND cm.user_id = NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-add users to public channels
DROP TRIGGER IF EXISTS trigger_add_user_to_public_channels ON public.profiles;
CREATE TRIGGER trigger_add_user_to_public_channels
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION add_user_to_public_channels();