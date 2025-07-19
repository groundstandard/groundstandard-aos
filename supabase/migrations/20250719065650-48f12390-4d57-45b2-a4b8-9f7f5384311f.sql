-- Enhanced Payment Management System Tables

-- Create payment_schedules table for automated recurring payments
CREATE TABLE public.payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  frequency TEXT NOT NULL, -- 'weekly', 'monthly', 'quarterly', 'yearly'
  start_date DATE NOT NULL,
  end_date DATE,
  next_payment_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'paused', 'cancelled', 'completed'
  stripe_subscription_id TEXT,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payment_reminders table for automated reminder system
CREATE TABLE public.payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  payment_due_date DATE NOT NULL,
  amount INTEGER NOT NULL,
  reminder_type TEXT NOT NULL, -- 'first_notice', 'second_notice', 'final_notice', 'overdue'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMPTZ,
  email_content TEXT,
  sms_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payment_analytics table for financial reporting
CREATE TABLE public.payment_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_revenue INTEGER NOT NULL DEFAULT 0,
  total_payments INTEGER NOT NULL DEFAULT 0,
  successful_payments INTEGER NOT NULL DEFAULT 0,
  failed_payments INTEGER NOT NULL DEFAULT 0,
  refunded_amount INTEGER NOT NULL DEFAULT 0,
  outstanding_amount INTEGER NOT NULL DEFAULT 0,
  new_memberships INTEGER NOT NULL DEFAULT 0,
  cancelled_memberships INTEGER NOT NULL DEFAULT 0,
  average_payment_value INTEGER NOT NULL DEFAULT 0,
  payment_conversion_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create late_fees table for automated late fee calculations
CREATE TABLE public.late_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL,
  student_id UUID NOT NULL,
  original_amount INTEGER NOT NULL,
  late_fee_amount INTEGER NOT NULL,
  days_overdue INTEGER NOT NULL,
  fee_percentage DECIMAL(5,2),
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'applied', 'waived'
  applied_at TIMESTAMPTZ,
  waived_at TIMESTAMPTZ,
  waived_by UUID,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payment_links table for generating payment links
CREATE TABLE public.payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  description TEXT,
  stripe_payment_link_id TEXT,
  link_url TEXT,
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'paid', 'expired', 'cancelled'
  paid_at TIMESTAMPTZ,
  payment_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create financial_reports table for compliance and audit
CREATE TABLE public.financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL, -- 'monthly', 'quarterly', 'yearly', 'tax', 'audit'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_revenue INTEGER NOT NULL,
  total_expenses INTEGER,
  net_income INTEGER,
  tax_amount INTEGER,
  report_data JSONB,
  file_url TEXT,
  generated_by UUID,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create email_templates table for payment communications
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL UNIQUE,
  template_type TEXT NOT NULL, -- 'payment_reminder', 'invoice', 'receipt', 'overdue_notice'
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  variables JSONB, -- Variables that can be used in the template
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.late_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment_schedules
CREATE POLICY "Users can view their own payment schedules" ON public.payment_schedules
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Admins can manage all payment schedules" ON public.payment_schedules
  FOR ALL USING (get_current_user_role() = 'admin');

-- Create RLS policies for payment_reminders
CREATE POLICY "Users can view their own payment reminders" ON public.payment_reminders
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Admins can manage all payment reminders" ON public.payment_reminders
  FOR ALL USING (get_current_user_role() = 'admin');

-- Create RLS policies for payment_analytics
CREATE POLICY "Admins can view payment analytics" ON public.payment_analytics
  FOR SELECT USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can manage payment analytics" ON public.payment_analytics
  FOR ALL USING (get_current_user_role() = 'admin');

-- Create RLS policies for late_fees
CREATE POLICY "Users can view their own late fees" ON public.late_fees
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Admins can manage all late fees" ON public.late_fees
  FOR ALL USING (get_current_user_role() = 'admin');

-- Create RLS policies for payment_links
CREATE POLICY "Users can view their own payment links" ON public.payment_links
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Admins can manage all payment links" ON public.payment_links
  FOR ALL USING (get_current_user_role() = 'admin');

-- Create RLS policies for financial_reports
CREATE POLICY "Admins can manage financial reports" ON public.financial_reports
  FOR ALL USING (get_current_user_role() = 'admin');

-- Create RLS policies for email_templates
CREATE POLICY "Admins can manage email templates" ON public.email_templates
  FOR ALL USING (get_current_user_role() = 'admin');

-- Create functions for automated processes
CREATE OR REPLACE FUNCTION public.calculate_late_fees()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert late fees for overdue payments
  INSERT INTO public.late_fees (payment_id, student_id, original_amount, late_fee_amount, days_overdue, fee_percentage)
  SELECT 
    p.id,
    p.student_id,
    p.amount,
    GREATEST(p.amount * 0.05, 500), -- 5% late fee, minimum $5
    EXTRACT(days FROM (now() - p.payment_date))::INTEGER,
    5.0
  FROM public.payments p
  WHERE p.status = 'pending'
    AND p.payment_date < (now() - INTERVAL '7 days')
    AND NOT EXISTS (
      SELECT 1 FROM public.late_fees lf 
      WHERE lf.payment_id = p.id
    );
END;
$$;

-- Create function to update payment analytics
CREATE OR REPLACE FUNCTION public.update_payment_analytics(
  start_date DATE,
  end_date DATE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_rev INTEGER;
  total_pay INTEGER;
  success_pay INTEGER;
  fail_pay INTEGER;
  refund_amt INTEGER;
  outstanding_amt INTEGER;
  avg_payment INTEGER;
  conversion_rate DECIMAL(5,2);
BEGIN
  -- Calculate analytics for the period
  SELECT 
    COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0),
    COUNT(*),
    COUNT(CASE WHEN status = 'completed' THEN 1 END),
    COUNT(CASE WHEN status = 'failed' THEN 1 END),
    COALESCE(SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0),
    COALESCE(AVG(CASE WHEN status = 'completed' THEN amount END), 0)
  INTO total_rev, total_pay, success_pay, fail_pay, refund_amt, outstanding_amt, avg_payment
  FROM public.payments
  WHERE payment_date::DATE BETWEEN start_date AND end_date;

  -- Calculate conversion rate
  conversion_rate := CASE 
    WHEN total_pay > 0 THEN (success_pay::DECIMAL / total_pay) * 100
    ELSE 0
  END;

  -- Insert or update analytics record
  INSERT INTO public.payment_analytics (
    period_start, period_end, total_revenue, total_payments,
    successful_payments, failed_payments, refunded_amount,
    outstanding_amount, average_payment_value, payment_conversion_rate
  ) VALUES (
    start_date, end_date, total_rev, total_pay,
    success_pay, fail_pay, refund_amt,
    outstanding_amt, avg_payment, conversion_rate
  )
  ON CONFLICT (period_start, period_end) 
  DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    total_payments = EXCLUDED.total_payments,
    successful_payments = EXCLUDED.successful_payments,
    failed_payments = EXCLUDED.failed_payments,
    refunded_amount = EXCLUDED.refunded_amount,
    outstanding_amount = EXCLUDED.outstanding_amount,
    average_payment_value = EXCLUDED.average_payment_value,
    payment_conversion_rate = EXCLUDED.payment_conversion_rate;
END;
$$;

-- Create triggers for automatic updates
CREATE TRIGGER update_payment_schedules_updated_at
  BEFORE UPDATE ON public.payment_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default email templates
INSERT INTO public.email_templates (template_name, template_type, subject, html_content, variables) VALUES
('payment_reminder_first', 'payment_reminder', 'Payment Reminder - {{student_name}}', 
'<h2>Payment Reminder</h2><p>Hi {{student_name}},</p><p>This is a friendly reminder that your payment of ${{amount}} is due on {{due_date}}.</p><p>Please ensure your payment is submitted on time to avoid any late fees.</p><p>Thank you!</p>', 
'{"student_name": "string", "amount": "number", "due_date": "date"}'::jsonb),

('payment_overdue', 'overdue_notice', 'Overdue Payment Notice - {{student_name}}', 
'<h2>Overdue Payment Notice</h2><p>Hi {{student_name}},</p><p>Your payment of ${{amount}} was due on {{due_date}} and is now overdue.</p><p>Please submit your payment immediately to avoid additional late fees.</p><p>Current late fee: ${{late_fee}}</p>', 
'{"student_name": "string", "amount": "number", "due_date": "date", "late_fee": "number"}'::jsonb),

('payment_receipt', 'receipt', 'Payment Receipt - {{payment_id}}', 
'<h2>Payment Receipt</h2><p>Hi {{student_name}},</p><p>Thank you for your payment!</p><p>Payment Details:</p><ul><li>Amount: ${{amount}}</li><li>Date: {{payment_date}}</li><li>Method: {{payment_method}}</li><li>Reference: {{payment_id}}</li></ul>', 
'{"student_name": "string", "amount": "number", "payment_date": "date", "payment_method": "string", "payment_id": "string"}'::jsonb);

-- Add unique constraint for analytics periods
ALTER TABLE public.payment_analytics ADD CONSTRAINT unique_analytics_period UNIQUE (period_start, period_end);