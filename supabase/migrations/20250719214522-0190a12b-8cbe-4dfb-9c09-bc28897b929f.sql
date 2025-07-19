-- Create storage policies for chat file uploads

-- Policy to allow authenticated users to upload files to chat buckets
CREATE POLICY "Authenticated users can upload to chat-images" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'chat-images');

CREATE POLICY "Authenticated users can view chat-images" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'chat-images');

CREATE POLICY "Authenticated users can upload to chat-videos" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'chat-videos');

CREATE POLICY "Authenticated users can view chat-videos" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'chat-videos');

CREATE POLICY "Authenticated users can upload to chat-files" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'chat-files');

CREATE POLICY "Authenticated users can view chat-files" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'chat-files');

CREATE POLICY "Authenticated users can upload to chat-audio" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'chat-audio');

CREATE POLICY "Authenticated users can view chat-audio" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'chat-audio');