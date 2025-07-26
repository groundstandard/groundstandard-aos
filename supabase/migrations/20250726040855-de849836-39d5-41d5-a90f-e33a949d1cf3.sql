-- Add RLS policy to allow admins to update payments
CREATE POLICY "Admins can update payments" ON public.payments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);