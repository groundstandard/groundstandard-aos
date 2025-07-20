-- Create performance targets table for admin settings
CREATE TABLE public.performance_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  academy_id UUID REFERENCES public.academies(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Student retention targets (percentages)
  retention_3_months DECIMAL(5,2) NOT NULL DEFAULT 90.0,
  retention_6_months DECIMAL(5,2) NOT NULL DEFAULT 85.0,
  retention_9_months DECIMAL(5,2) NOT NULL DEFAULT 80.0,
  retention_12_months DECIMAL(5,2) NOT NULL DEFAULT 75.0,
  
  -- Class capacity targets (percentages)
  capacity_adults DECIMAL(5,2) NOT NULL DEFAULT 80.0,
  capacity_youth DECIMAL(5,2) NOT NULL DEFAULT 75.0,
  capacity_first_30_days DECIMAL(5,2) NOT NULL DEFAULT 60.0,
  capacity_after_30_days DECIMAL(5,2) NOT NULL DEFAULT 85.0,
  
  -- Revenue targets (in cents)
  revenue_monthly INTEGER NOT NULL DEFAULT 2000000, -- $20,000
  revenue_quarterly INTEGER NOT NULL DEFAULT 6000000, -- $60,000
  revenue_half_yearly INTEGER NOT NULL DEFAULT 12000000, -- $120,000
  revenue_yearly INTEGER NOT NULL DEFAULT 24000000 -- $240,000
);

-- Enable RLS
ALTER TABLE public.performance_targets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage performance targets"
ON public.performance_targets
FOR ALL
USING (get_current_user_role() = 'admin');

-- Create trigger for updating timestamps
CREATE TRIGGER update_performance_targets_updated_at
BEFORE UPDATE ON public.performance_targets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();