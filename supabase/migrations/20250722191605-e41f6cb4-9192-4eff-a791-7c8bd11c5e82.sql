-- Create contact assignments tables
CREATE TABLE public.contact_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL,
  membership_plan_id UUID NOT NULL REFERENCES public.membership_plans(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  monthly_price_cents INTEGER,
  assigned_by UUID,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.contact_discounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL,
  discount_type_id UUID NOT NULL REFERENCES public.discount_types(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  assigned_by UUID,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  max_usage INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.contact_drop_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL,
  drop_in_option_id UUID NOT NULL REFERENCES public.drop_in_options(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'purchased' CHECK (status IN ('purchased', 'used', 'expired', 'refunded')),
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  assigned_by UUID,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_drop_ins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage all contact assignments" 
ON public.contact_memberships 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

CREATE POLICY "Admins can manage all contact discounts" 
ON public.contact_discounts 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

CREATE POLICY "Admins can manage all contact drop-ins" 
ON public.contact_drop_ins 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

-- Users can view their own assignments
CREATE POLICY "Users can view their own memberships" 
ON public.contact_memberships 
FOR SELECT 
USING (contact_id = auth.uid());

CREATE POLICY "Users can view their own discounts" 
ON public.contact_discounts 
FOR SELECT 
USING (contact_id = auth.uid());

CREATE POLICY "Users can view their own drop-ins" 
ON public.contact_drop_ins 
FOR SELECT 
USING (contact_id = auth.uid());

-- Add triggers for updated_at
CREATE TRIGGER update_contact_memberships_updated_at
BEFORE UPDATE ON public.contact_memberships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contact_discounts_updated_at
BEFORE UPDATE ON public.contact_discounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contact_drop_ins_updated_at
BEFORE UPDATE ON public.contact_drop_ins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();