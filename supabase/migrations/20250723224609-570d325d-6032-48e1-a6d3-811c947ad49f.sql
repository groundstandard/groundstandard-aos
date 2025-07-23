-- Create payment action logs table for audit trail
CREATE TABLE IF NOT EXISTS public.payment_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  stripe_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_action_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for payment action logs
CREATE POLICY "Admin can manage payment action logs" 
ON public.payment_action_logs 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_payment_action_logs_payment_id ON public.payment_action_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_action_logs_created_at ON public.payment_action_logs(created_at);