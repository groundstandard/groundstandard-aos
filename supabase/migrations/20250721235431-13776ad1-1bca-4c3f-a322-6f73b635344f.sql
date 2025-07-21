-- Create refunds table for payment refund management
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT,
  refund_type TEXT NOT NULL DEFAULT 'full', -- 'full', 'partial'
  stripe_refund_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  processed_by UUID REFERENCES public.profiles(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create account credits table for managing customer account credits
CREATE TABLE IF NOT EXISTS public.account_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL, -- 'refund', 'manual', 'promotion', 'overpayment'
  source_reference_id UUID, -- references refund_id or other source
  description TEXT,
  balance INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'used', 'expired'
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tax settings table for tax compliance
CREATE TABLE IF NOT EXISTS public.tax_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction TEXT NOT NULL, -- 'federal', 'state', 'local'
  tax_name TEXT NOT NULL,
  tax_rate DECIMAL(5,4) NOT NULL, -- e.g., 0.0825 for 8.25%
  tax_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage', 'fixed'
  applicable_services TEXT[] DEFAULT '{}', -- services this tax applies to
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payment taxes table to track taxes on payments
CREATE TABLE IF NOT EXISTS public.payment_taxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  tax_setting_id UUID NOT NULL REFERENCES public.tax_settings(id),
  tax_amount INTEGER NOT NULL,
  tax_rate DECIMAL(5,4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add tax_amount column to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS tax_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS subtotal_amount INTEGER,
ADD COLUMN IF NOT EXISTS applied_credits INTEGER DEFAULT 0;

-- Create invoice templates table for customizable invoicing
CREATE TABLE IF NOT EXISTS public.invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  template_html TEXT NOT NULL,
  template_css TEXT,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add template_id and pdf_url to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.invoice_templates(id),
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tax_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS subtotal_amount INTEGER;

-- Enable RLS on new tables
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for refunds
CREATE POLICY "Admins can manage all refunds" 
ON public.refunds 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

CREATE POLICY "Users can view their own refunds" 
ON public.refunds 
FOR SELECT 
USING (student_id = auth.uid());

-- RLS policies for account credits
CREATE POLICY "Admins can manage all credits" 
ON public.account_credits 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

CREATE POLICY "Users can view their own credits" 
ON public.account_credits 
FOR SELECT 
USING (student_id = auth.uid());

-- RLS policies for tax settings
CREATE POLICY "Admins can manage tax settings" 
ON public.tax_settings 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

-- RLS policies for payment taxes
CREATE POLICY "Admins can manage payment taxes" 
ON public.payment_taxes 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

CREATE POLICY "Users can view their payment taxes" 
ON public.payment_taxes 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.payments 
  WHERE payments.id = payment_taxes.payment_id 
  AND payments.student_id = auth.uid()
));

-- RLS policies for invoice templates
CREATE POLICY "Admins can manage invoice templates" 
ON public.invoice_templates 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON public.refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_student_id ON public.refunds(student_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refunds(status);

CREATE INDEX IF NOT EXISTS idx_account_credits_student_id ON public.account_credits(student_id);
CREATE INDEX IF NOT EXISTS idx_account_credits_status ON public.account_credits(status);

CREATE INDEX IF NOT EXISTS idx_payment_taxes_payment_id ON public.payment_taxes(payment_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_refunds_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_account_credits_updated_at
  BEFORE UPDATE ON public.account_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tax_settings_updated_at
  BEFORE UPDATE ON public.tax_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoice_templates_updated_at
  BEFORE UPDATE ON public.invoice_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default tax settings (US federal and common state rates)
INSERT INTO public.tax_settings (jurisdiction, tax_name, tax_rate, applicable_services) VALUES
('federal', 'Federal Tax', 0.0000, ARRAY['membership', 'classes', 'products']),
('state', 'State Sales Tax', 0.0625, ARRAY['membership', 'classes', 'products']),
('local', 'Local Tax', 0.0100, ARRAY['membership', 'classes', 'products'])
ON CONFLICT DO NOTHING;

-- Insert default invoice template
INSERT INTO public.invoice_templates (template_name, template_html, is_default) VALUES
('Default Invoice Template', 
'<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .invoice-details { margin-bottom: 30px; }
        .line-items { width: 100%; border-collapse: collapse; }
        .line-items th, .line-items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .totals { text-align: right; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{academy_name}}</h1>
        <p>{{academy_address}}</p>
    </div>
    <div class="invoice-details">
        <h2>Invoice #{{invoice_number}}</h2>
        <p>Date: {{invoice_date}}</p>
        <p>Due Date: {{due_date}}</p>
        <p>Bill To: {{student_name}}</p>
    </div>
    <table class="line-items">
        <thead>
            <tr><th>Description</th><th>Amount</th></tr>
        </thead>
        <tbody>
            {{#line_items}}
            <tr><td>{{description}}</td><td>${{amount}}</td></tr>
            {{/line_items}}
        </tbody>
    </table>
    <div class="totals">
        <p>Subtotal: ${{subtotal}}</p>
        <p>Tax: ${{tax_amount}}</p>
        <p><strong>Total: ${{total_amount}}</strong></p>
    </div>
</body>
</html>', 
true)
ON CONFLICT DO NOTHING;