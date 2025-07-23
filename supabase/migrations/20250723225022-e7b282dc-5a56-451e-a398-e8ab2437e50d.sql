-- Create financial reports table
CREATE TABLE IF NOT EXISTS public.financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  generated_by UUID REFERENCES auth.users(id),
  report_data JSONB NOT NULL,
  format TEXT DEFAULT 'json',
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for financial reports
CREATE POLICY "Admin can manage financial reports" 
ON public.financial_reports 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_financial_reports_type ON public.financial_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_financial_reports_period ON public.financial_reports(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_financial_reports_generated_at ON public.financial_reports(generated_at);