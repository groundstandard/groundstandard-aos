-- Drop the problematic policies
DROP POLICY IF EXISTS "Academy owners can upload their logo" ON storage.objects;
DROP POLICY IF EXISTS "Academy owners can update their logo" ON storage.objects;
DROP POLICY IF EXISTS "Academy owners can delete their logo" ON storage.objects;

-- Create simpler, working policies
-- For academy logos, the path format is: {academy_id}/logo.{extension}
CREATE POLICY "Academy owners can upload their logo" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'academy-logos' AND 
  auth.uid() IN (
    SELECT owner_id FROM public.academies 
    WHERE id::text = split_part(name, '/', 1)
  )
);

CREATE POLICY "Academy owners can update their logo" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'academy-logos' AND 
  auth.uid() IN (
    SELECT owner_id FROM public.academies 
    WHERE id::text = split_part(name, '/', 1)
  )
);

CREATE POLICY "Academy owners can delete their logo" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'academy-logos' AND 
  auth.uid() IN (
    SELECT owner_id FROM public.academies 
    WHERE id::text = split_part(name, '/', 1)
  )
);