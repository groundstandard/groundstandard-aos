-- Create missing tables for payment system functionality

-- Payment reminders table
CREATE TABLE IF NOT EXISTS public.payment_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  due_date DATE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_by UUID REFERENCES public.profiles(id),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Payment schedules table
CREATE TABLE IF NOT EXISTS public.payment_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  frequency TEXT NOT NULL,
  start_date DATE NOT NULL,
  next_payment_date DATE NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'card',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Refunds table
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_refund_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  reason TEXT,
  status TEXT NOT NULL,
  processed_by UUID REFERENCES public.profiles(id),
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Installment plans table  
CREATE TABLE IF NOT EXISTS public.installment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_amount_cents INTEGER NOT NULL,
  installment_amount_cents INTEGER NOT NULL,
  number_of_installments INTEGER NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  description TEXT,
  first_payment_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Individual installment payments table
CREATE TABLE IF NOT EXISTS public.installment_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  installment_plan_id UUID NOT NULL REFERENCES public.installment_plans(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Financial reports table
CREATE TABLE IF NOT EXISTS public.financial_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_revenue INTEGER DEFAULT 0,
  net_income INTEGER DEFAULT 0,
  report_data JSONB,
  generated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Payment analytics table (if not exists)
CREATE TABLE IF NOT EXISTS public.payment_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_revenue INTEGER DEFAULT 0,
  total_payments INTEGER DEFAULT 0,
  successful_payments INTEGER DEFAULT 0,
  failed_payments INTEGER DEFAULT 0,
  refunded_amount INTEGER DEFAULT 0,
  outstanding_amount INTEGER DEFAULT 0,
  average_payment_value INTEGER DEFAULT 0,
  payment_conversion_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(period_start, period_end)
);

-- Late fees table (if not exists)
CREATE TABLE IF NOT EXISTS public.late_fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  original_amount INTEGER NOT NULL,
  late_fee_amount INTEGER NOT NULL,
  days_overdue INTEGER NOT NULL,
  fee_percentage DECIMAL(5,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  applied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.late_fees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment_reminders
CREATE POLICY "Admins can manage payment reminders" ON public.payment_reminders
  FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

CREATE POLICY "Users can view their own reminders" ON public.payment_reminders
  FOR SELECT USING (student_id = auth.uid());

-- Create RLS policies for payment_schedules
CREATE POLICY "Admins can manage payment schedules" ON public.payment_schedules
  FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

CREATE POLICY "Users can view their own schedules" ON public.payment_schedules
  FOR SELECT USING (student_id = auth.uid());

-- Create RLS policies for refunds
CREATE POLICY "Admins can manage refunds" ON public.refunds
  FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

-- Create RLS policies for installment_plans
CREATE POLICY "Admins can manage installment plans" ON public.installment_plans
  FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

CREATE POLICY "Users can view their own installment plans" ON public.installment_plans
  FOR SELECT USING (student_id = auth.uid());

-- Create RLS policies for installment_payments
CREATE POLICY "Admins can manage installment payments" ON public.installment_payments
  FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

CREATE POLICY "Users can view their own installment payments" ON public.installment_payments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.installment_plans 
    WHERE installment_plans.id = installment_payments.installment_plan_id 
    AND installment_plans.student_id = auth.uid()
  ));

-- Create RLS policies for financial_reports
CREATE POLICY "Admins can manage financial reports" ON public.financial_reports
  FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

-- Create RLS policies for payment_analytics
CREATE POLICY "Admins can view payment analytics" ON public.payment_analytics
  FOR SELECT USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

CREATE POLICY "System can insert payment analytics" ON public.payment_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update payment analytics" ON public.payment_analytics
  FOR UPDATE USING (true);

-- Create RLS policies for late_fees
CREATE POLICY "Admins can manage late fees" ON public.late_fees
  FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

CREATE POLICY "Users can view their own late fees" ON public.late_fees
  FOR SELECT USING (student_id = auth.uid());

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_payment_reminders_updated_at
  BEFORE UPDATE ON public.payment_reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_schedules_updated_at
  BEFORE UPDATE ON public.payment_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_installment_plans_updated_at
  BEFORE UPDATE ON public.installment_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_installment_payments_updated_at
  BEFORE UPDATE ON public.installment_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();