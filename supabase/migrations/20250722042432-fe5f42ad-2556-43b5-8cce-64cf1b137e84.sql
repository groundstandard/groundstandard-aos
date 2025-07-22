-- Drop existing policies and create simpler ones that work with academy memberships
DROP POLICY IF EXISTS "Academy owners can upload their logo" ON storage.objects;
DROP POLICY IF EXISTS "Academy owners can update their logo" ON storage.objects;
DROP POLICY IF EXISTS "Academy owners can delete their logo" ON storage.objects;

-- Create policies based on academy memberships instead of direct ownership
CREATE POLICY "Academy admins can upload logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'academy-logos' AND 
  auth.uid() IN (
    SELECT user_id FROM public.academy_memberships 
    WHERE academy_id::text = split_part(name, '/', 1)
    AND role IN ('owner', 'admin')
    AND is_active = true
  )
);

CREATE POLICY "Academy admins can update logos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'academy-logos' AND 
  auth.uid() IN (
    SELECT user_id FROM public.academy_memberships 
    WHERE academy_id::text = split_part(name, '/', 1)
    AND role IN ('owner', 'admin')
    AND is_active = true
  )
);

CREATE POLICY "Academy admins can delete logos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'academy-logos' AND 
  auth.uid() IN (
    SELECT user_id FROM public.academy_memberships 
    WHERE academy_id::text = split_part(name, '/', 1)
    AND role IN ('owner', 'admin')
    AND is_active = true
  )
);