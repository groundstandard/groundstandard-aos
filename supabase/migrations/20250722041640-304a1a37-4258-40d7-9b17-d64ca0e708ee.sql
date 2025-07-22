-- Add logo_url field to academies table
ALTER TABLE public.academies 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create storage bucket for academy logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('academy-logos', 'academy-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for academy logos
CREATE POLICY "Anyone can view academy logos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'academy-logos');

CREATE POLICY "Academy owners can upload their logo" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'academy-logos' AND 
  auth.uid() IN (
    SELECT owner_id FROM public.academies 
    WHERE id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Academy owners can update their logo" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'academy-logos' AND 
  auth.uid() IN (
    SELECT owner_id FROM public.academies 
    WHERE id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Academy owners can delete their logo" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'academy-logos' AND 
  auth.uid() IN (
    SELECT owner_id FROM public.academies 
    WHERE id::text = (storage.foldername(name))[1]
  )
);