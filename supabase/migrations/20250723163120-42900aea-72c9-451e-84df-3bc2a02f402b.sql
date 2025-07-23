-- Add missing payment tracking columns for failed payment handling (skip if exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'retry_count') THEN
        ALTER TABLE public.payments ADD COLUMN retry_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'failure_reason') THEN
        ALTER TABLE public.payments ADD COLUMN failure_reason TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'next_retry_date') THEN
        ALTER TABLE public.payments ADD COLUMN next_retry_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'tax_amount') THEN
        ALTER TABLE public.payments ADD COLUMN tax_amount INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'subtotal_amount') THEN
        ALTER TABLE public.payments ADD COLUMN subtotal_amount INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'applied_credits') THEN
        ALTER TABLE public.payments ADD COLUMN applied_credits INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create tax_settings table (skip if exists)
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

-- Enable RLS on tax_settings (skip if already enabled)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'tax_settings' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create refunds table (skip if exists)
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

-- Enable RLS on refunds (skip if already enabled)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'refunds' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies only if they don't exist
DO $$
BEGIN
    -- Tax settings policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tax_settings' AND policyname = 'Admins can manage tax settings v2') THEN
        CREATE POLICY "Admins can manage tax settings v2" 
        ON public.tax_settings 
        FOR ALL 
        USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tax_settings' AND policyname = 'Users can view active tax settings') THEN
        CREATE POLICY "Users can view active tax settings" 
        ON public.tax_settings 
        FOR SELECT 
        USING (is_active = true);
    END IF;
    
    -- Refunds policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'refunds' AND policyname = 'Admins can manage refunds') THEN
        CREATE POLICY "Admins can manage refunds" 
        ON public.refunds 
        FOR ALL 
        USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'refunds' AND policyname = 'Users can view their own refunds') THEN
        CREATE POLICY "Users can view their own refunds" 
        ON public.refunds 
        FOR SELECT 
        USING (student_id = auth.uid());
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_retry_status ON public.payments (status, retry_count, payment_date) WHERE status IN ('failed', 'requires_action');
CREATE INDEX IF NOT EXISTS idx_payments_student_status ON public.payments (student_id, status, payment_date);
CREATE INDEX IF NOT EXISTS idx_tax_settings_active ON public.tax_settings (is_active, jurisdiction);
CREATE INDEX IF NOT EXISTS idx_refunds_payment ON public.refunds (payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_student ON public.refunds (student_id, status);