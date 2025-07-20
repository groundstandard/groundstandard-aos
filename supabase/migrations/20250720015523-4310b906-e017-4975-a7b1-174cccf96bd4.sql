-- Create membership plan types and pricing structure tables

-- Membership plan types (contracts, monthly, etc.)
CREATE TABLE public.membership_plan_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  has_contract BOOLEAN DEFAULT false,
  contract_length_months INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Membership plans (specific offerings)
CREATE TABLE public.membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type_id UUID REFERENCES public.membership_plan_types(id),
  name TEXT NOT NULL,
  description TEXT,
  age_group TEXT CHECK (age_group IN ('adult', 'youth', 'all')),
  classes_per_week INTEGER,
  is_unlimited BOOLEAN DEFAULT false,
  base_price_cents INTEGER NOT NULL,
  setup_fee_cents INTEGER DEFAULT 0,
  billing_cycle TEXT CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly', 'annually')),
  trial_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Private sessions and packages
CREATE TABLE public.private_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  session_type TEXT CHECK (session_type IN ('single', 'package')),
  package_size INTEGER DEFAULT 1,
  price_per_session_cents INTEGER NOT NULL,
  total_price_cents INTEGER NOT NULL,
  instructor_id UUID REFERENCES public.profiles(id),
  duration_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Drop-in classes and trial periods
CREATE TABLE public.drop_in_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  option_type TEXT CHECK (option_type IN ('drop_in', 'trial')),
  price_cents INTEGER NOT NULL,
  trial_duration_days INTEGER,
  age_group TEXT CHECK (age_group IN ('adult', 'youth', 'all')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Discount types and family discounts
CREATE TABLE public.discount_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed_amount', 'family')),
  discount_value DECIMAL(10,2),
  max_family_members INTEGER,
  applies_to TEXT CHECK (applies_to IN ('membership', 'private_sessions', 'drop_in', 'all')),
  minimum_members INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.membership_plan_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drop_in_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_types ENABLE ROW LEVEL SECURITY;

-- Admin can manage all
CREATE POLICY "Admins can manage membership plan types" ON public.membership_plan_types FOR ALL USING (get_current_user_role() = 'admin');
CREATE POLICY "Admins can manage membership plans" ON public.membership_plans FOR ALL USING (get_current_user_role() = 'admin');
CREATE POLICY "Admins can manage private sessions" ON public.private_sessions FOR ALL USING (get_current_user_role() = 'admin');
CREATE POLICY "Admins can manage drop in options" ON public.drop_in_options FOR ALL USING (get_current_user_role() = 'admin');
CREATE POLICY "Admins can manage discount types" ON public.discount_types FOR ALL USING (get_current_user_role() = 'admin');

-- Users can view active plans
CREATE POLICY "Users can view active membership plans" ON public.membership_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Users can view active private sessions" ON public.private_sessions FOR SELECT USING (is_active = true);
CREATE POLICY "Users can view active drop in options" ON public.drop_in_options FOR SELECT USING (is_active = true);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_membership_plan_types_updated_at BEFORE UPDATE ON public.membership_plan_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_membership_plans_updated_at BEFORE UPDATE ON public.membership_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_private_sessions_updated_at BEFORE UPDATE ON public.private_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drop_in_options_updated_at BEFORE UPDATE ON public.drop_in_options FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discount_types_updated_at BEFORE UPDATE ON public.discount_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();