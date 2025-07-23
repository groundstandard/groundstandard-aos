-- Add missing payment tracking columns for failed payment handling
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS failure_reason TEXT,
ADD COLUMN IF NOT EXISTS next_retry_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tax_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS subtotal_amount INTEGER,
ADD COLUMN IF NOT EXISTS applied_credits INTEGER DEFAULT 0;

-- Create tax_settings table for comprehensive tax management
CREATE TABLE IF NOT EXISTS public.tax_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jurisdiction TEXT NOT NULL,
  tax_name TEXT NOT NULL,
  tax_rate DECIMAL(5,4) NOT NULL,
  tax_type TEXT NOT NULL DEFAULT 'percentage' CHECK (tax_type IN ('percentage', 'fixed')),
  applicable_services TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tax_settings
ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for tax_settings
CREATE POLICY "Admins can manage tax settings" 
ON public.tax_settings 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

CREATE POLICY "Users can view active tax settings" 
ON public.tax_settings 
FOR SELECT 
USING (is_active = true);

-- Create refunds table for comprehensive refund management
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL,
  student_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  refund_type TEXT NOT NULL CHECK (refund_type IN ('full', 'partial')),
  stripe_refund_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on refunds
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- Create policies for refunds
CREATE POLICY "Admins can manage refunds" 
ON public.refunds 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

CREATE POLICY "Users can view their own refunds" 
ON public.refunds 
FOR SELECT 
USING (student_id = auth.uid());

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_retry_status ON public.payments (status, retry_count, payment_date) WHERE status IN ('failed', 'requires_action');
CREATE INDEX IF NOT EXISTS idx_payments_student_status ON public.payments (student_id, status, payment_date);
CREATE INDEX IF NOT EXISTS idx_tax_settings_active ON public.tax_settings (is_active, jurisdiction);
CREATE INDEX IF NOT EXISTS idx_refunds_payment ON public.refunds (payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_student ON public.refunds (student_id, status);

-- Add updated_at triggers
CREATE TRIGGER update_tax_settings_updated_at
BEFORE UPDATE ON public.tax_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at
BEFORE UPDATE ON public.refunds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();