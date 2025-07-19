-- Create belt_tests table for tracking belt promotions
CREATE TABLE public.belt_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  current_belt TEXT NOT NULL,
  target_belt TEXT NOT NULL,
  test_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  result TEXT,
  evaluated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table for tracking student payments
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for belt_tests table
ALTER TABLE public.belt_tests ENABLE ROW LEVEL SECURITY;

-- Create policies for belt_tests
CREATE POLICY "Admins can manage all belt tests" 
ON public.belt_tests 
FOR ALL 
USING (get_current_user_role() = 'admin');

CREATE POLICY "Students can view their own belt tests" 
ON public.belt_tests 
FOR SELECT 
USING (auth.uid() = student_id);

-- Enable RLS for payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments
CREATE POLICY "Admins can manage all payments" 
ON public.payments 
FOR ALL 
USING (get_current_user_role() = 'admin');

CREATE POLICY "Students can view their own payments" 
ON public.payments 
FOR SELECT 
USING (auth.uid() = student_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_belt_tests_updated_at
BEFORE UPDATE ON public.belt_tests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();