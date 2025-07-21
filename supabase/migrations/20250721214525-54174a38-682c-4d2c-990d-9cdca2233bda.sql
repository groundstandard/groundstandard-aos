-- Add support for multiple payment methods and installment plans
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payment_method_type TEXT DEFAULT 'card',
ADD COLUMN IF NOT EXISTS ach_bank_name TEXT,
ADD COLUMN IF NOT EXISTS ach_last4 TEXT,
ADD COLUMN IF NOT EXISTS installment_plan_id UUID,
ADD COLUMN IF NOT EXISTS installment_number INTEGER,
ADD COLUMN IF NOT EXISTS total_installments INTEGER;

-- Create installment plans table
CREATE TABLE IF NOT EXISTS public.installment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount INTEGER NOT NULL,
  installments_count INTEGER NOT NULL,
  installment_amount INTEGER NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly', -- weekly, monthly, quarterly
  start_date DATE NOT NULL,
  next_payment_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, cancelled, paused
  description TEXT,
  auto_pay BOOLEAN DEFAULT true,
  stripe_setup_intent_id TEXT,
  preferred_payment_method TEXT DEFAULT 'card', -- card, ach
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create saved payment methods table
CREATE TABLE IF NOT EXISTS public.saved_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL UNIQUE,
  payment_type TEXT NOT NULL, -- card, us_bank_account
  is_default BOOLEAN DEFAULT false,
  card_brand TEXT,
  card_last4 TEXT,
  bank_name TEXT,
  bank_last4 TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.installment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS policies for installment plans
CREATE POLICY "Users can view their own installment plans" 
ON public.installment_plans 
FOR SELECT 
USING (student_id = auth.uid());

CREATE POLICY "Users can create their own installment plans" 
ON public.installment_plans 
FOR INSERT 
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Users can update their own installment plans" 
ON public.installment_plans 
FOR UPDATE 
USING (student_id = auth.uid());

CREATE POLICY "Admins can manage all installment plans" 
ON public.installment_plans 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

-- RLS policies for saved payment methods
CREATE POLICY "Users can view their own payment methods" 
ON public.saved_payment_methods 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own payment methods" 
ON public.saved_payment_methods 
FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all payment methods" 
ON public.saved_payment_methods 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_installment_plans_student_id ON public.installment_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_installment_plans_status ON public.installment_plans(status);
CREATE INDEX IF NOT EXISTS idx_installment_plans_next_payment ON public.installment_plans(next_payment_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_saved_payment_methods_user_id ON public.saved_payment_methods(user_id);

-- Add triggers
CREATE TRIGGER update_installment_plans_updated_at
  BEFORE UPDATE ON public.installment_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saved_payment_methods_updated_at
  BEFORE UPDATE ON public.saved_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();