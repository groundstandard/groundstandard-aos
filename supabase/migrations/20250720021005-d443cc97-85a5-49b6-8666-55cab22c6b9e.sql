-- Remove family-specific fields from discount_types since they don't apply to all discounts
ALTER TABLE public.discount_types 
DROP COLUMN IF EXISTS minimum_members,
DROP COLUMN IF EXISTS max_family_members;

-- Create a dedicated family discount system
CREATE TABLE public.family_discount_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  applies_to TEXT NOT NULL DEFAULT 'membership', -- 'membership', 'private_sessions', 'drop_in', 'all'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create family discount tiers for each family member position
CREATE TABLE public.family_discount_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_plan_id UUID NOT NULL REFERENCES public.family_discount_plans(id) ON DELETE CASCADE,
  family_member_position INTEGER NOT NULL, -- 2, 3, 4, etc. (1st member pays full price)
  discount_type TEXT NOT NULL, -- 'percentage', 'fixed_amount', 'free'
  discount_value NUMERIC, -- percentage (1-100) or dollar amount, null if free
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(family_plan_id, family_member_position)
);

-- Enable RLS
ALTER TABLE public.family_discount_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_discount_tiers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins and owners can manage family discount plans" 
ON public.family_discount_plans 
FOR ALL 
USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

CREATE POLICY "Admins and owners can manage family discount tiers" 
ON public.family_discount_tiers 
FOR ALL 
USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

-- Add updated_at triggers
CREATE TRIGGER update_family_discount_plans_updated_at
  BEFORE UPDATE ON public.family_discount_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_discount_tiers_updated_at
  BEFORE UPDATE ON public.family_discount_tiers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some example family discount plans
INSERT INTO public.family_discount_plans (name, description, applies_to) VALUES 
('Standard Family Plan', 'Progressive discounts for additional family members', 'membership'),
('Military Family Plan', 'Special discounts for military families', 'all');

-- Insert example tiers for standard family plan
INSERT INTO public.family_discount_tiers (family_plan_id, family_member_position, discount_type, discount_value)
SELECT 
  (SELECT id FROM public.family_discount_plans WHERE name = 'Standard Family Plan'),
  2, 'percentage', 20;

INSERT INTO public.family_discount_tiers (family_plan_id, family_member_position, discount_type, discount_value)
SELECT 
  (SELECT id FROM public.family_discount_plans WHERE name = 'Standard Family Plan'),
  3, 'percentage', 30;

-- Insert example tiers for military family plan  
INSERT INTO public.family_discount_tiers (family_plan_id, family_member_position, discount_type, discount_value)
SELECT 
  (SELECT id FROM public.family_discount_plans WHERE name = 'Military Family Plan'),
  2, 'free', null;

INSERT INTO public.family_discount_tiers (family_plan_id, family_member_position, discount_type, discount_value)
SELECT 
  (SELECT id FROM public.family_discount_plans WHERE name = 'Military Family Plan'),
  3, 'percentage', 50;