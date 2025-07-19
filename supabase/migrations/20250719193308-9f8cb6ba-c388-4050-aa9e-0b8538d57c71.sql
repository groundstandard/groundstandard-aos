-- Create storage buckets for different file types
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('chat-images', 'chat-images', true),
  ('chat-videos', 'chat-videos', true),
  ('chat-files', 'chat-files', true),
  ('chat-audio', 'chat-audio', true);

-- Create storage policies for chat attachments
CREATE POLICY "Users can upload chat images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-images' AND 
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view chat images" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-images');

CREATE POLICY "Users can upload chat videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-videos' AND 
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view chat videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-videos');

CREATE POLICY "Users can upload chat files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-files' AND 
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view chat files" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-files');

CREATE POLICY "Users can upload chat audio" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-audio' AND 
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view chat audio" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-audio');

-- Add new columns to existing chat_messages table
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES public.chat_messages(id),
ADD COLUMN IF NOT EXISTS thread_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS mentioned_users UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file')),
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;

-- Create message reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS on message_reactions
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Create policies for message reactions
CREATE POLICY "Users can view message reactions" ON public.message_reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can add their own reactions" ON public.message_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions" ON public.message_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Create direct message channels table
CREATE TABLE IF NOT EXISTS public.direct_message_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id != user2_id)
);

-- Enable RLS on direct_message_channels
ALTER TABLE public.direct_message_channels ENABLE ROW LEVEL SECURITY;

-- Create policies for direct message channels
CREATE POLICY "Users can view their own DM channels" ON public.direct_message_channels
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create DM channels" ON public.direct_message_channels
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Create function to update thread count
CREATE OR REPLACE FUNCTION public.update_thread_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_message_id IS NOT NULL THEN
    UPDATE public.chat_messages 
    SET thread_count = (
      SELECT COUNT(*) 
      FROM public.chat_messages 
      WHERE parent_message_id = NEW.parent_message_id
    )
    WHERE id = NEW.parent_message_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for thread count updates
DROP TRIGGER IF EXISTS update_thread_count_trigger ON public.chat_messages;
CREATE TRIGGER update_thread_count_trigger
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_thread_count();

-- Create function to get or create DM channel
CREATE OR REPLACE FUNCTION public.get_or_create_dm_channel(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
  channel_id UUID;
  current_user_id UUID := auth.uid();
BEGIN
  -- Ensure user1_id is always the smaller UUID for consistency
  SELECT id INTO channel_id
  FROM public.direct_message_channels
  WHERE (user1_id = LEAST(current_user_id, other_user_id) AND user2_id = GREATEST(current_user_id, other_user_id));
  
  IF channel_id IS NULL THEN
    INSERT INTO public.direct_message_channels (user1_id, user2_id)
    VALUES (LEAST(current_user_id, other_user_id), GREATEST(current_user_id, other_user_id))
    RETURNING id INTO channel_id;
  END IF;
  
  RETURN channel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_parent_id ON public.chat_messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_mentioned_users ON public.chat_messages USING GIN(mentioned_users);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_direct_message_channels_users ON public.direct_message_channels(user1_id, user2_id);