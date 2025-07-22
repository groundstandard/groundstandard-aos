-- First, let's create the family relationships table
CREATE TABLE public.family_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  primary_contact_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  related_contact_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('parent', 'child', 'spouse', 'guardian', 'sibling')),
  is_primary_contact BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(primary_contact_id, related_contact_id)
);

-- Create indexes for performance
CREATE INDEX idx_family_relationships_primary ON family_relationships(primary_contact_id);
CREATE INDEX idx_family_relationships_related ON family_relationships(related_contact_id);

-- Enable RLS
ALTER TABLE public.family_relationships ENABLE ROW LEVEL SECURITY;

-- Create policies for family relationships
CREATE POLICY "family_relationships_academy_isolation"
ON public.family_relationships
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM academy_memberships am1
    JOIN academy_memberships am2 ON am1.academy_id = am2.academy_id
    WHERE am1.user_id = auth.uid() 
    AND (am2.user_id = family_relationships.primary_contact_id OR am2.user_id = family_relationships.related_contact_id)
    AND am1.is_active = true 
    AND am2.is_active = true
  )
);

-- Update membership_plans to better support class access and billing
ALTER TABLE public.membership_plans ADD COLUMN IF NOT EXISTS includes_classes BOOLEAN DEFAULT true;
ALTER TABLE public.membership_plans ADD COLUMN IF NOT EXISTS max_classes_per_week INTEGER;
ALTER TABLE public.membership_plans ADD COLUMN IF NOT EXISTS allowed_class_types TEXT[] DEFAULT '{}';
ALTER TABLE public.membership_plans ADD COLUMN IF NOT EXISTS billing_frequency TEXT DEFAULT 'monthly' CHECK (billing_frequency IN ('weekly', 'monthly', 'quarterly', 'annually'));
ALTER TABLE public.membership_plans ADD COLUMN IF NOT EXISTS auto_billing BOOLEAN DEFAULT true;
ALTER TABLE public.membership_plans ADD COLUMN IF NOT EXISTS trial_period_days INTEGER DEFAULT 0;

-- Create a membership subscriptions table to track active memberships
CREATE TABLE public.membership_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  membership_plan_id UUID NOT NULL REFERENCES public.membership_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired', 'trial')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  next_billing_date DATE,
  billing_amount_cents INTEGER NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  pause_reason TEXT,
  pause_start_date DATE,
  pause_end_date DATE,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on membership subscriptions
ALTER TABLE public.membership_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for membership subscriptions
CREATE POLICY "membership_subscriptions_academy_isolation"
ON public.membership_subscriptions
FOR ALL
USING (
  auth.uid() = contact_id OR
  EXISTS (
    SELECT 1 FROM academy_memberships am1
    JOIN academy_memberships am2 ON am1.academy_id = am2.academy_id
    WHERE am1.user_id = auth.uid() 
    AND am2.user_id = membership_subscriptions.contact_id
    AND am1.is_active = true 
    AND am2.is_active = true
  )
);

-- Create class access permissions table
CREATE TABLE public.class_access_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  membership_plan_id UUID NOT NULL REFERENCES public.membership_plans(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  access_type TEXT NOT NULL DEFAULT 'included' CHECK (access_type IN ('included', 'additional_fee', 'restricted')),
  additional_fee_cents INTEGER DEFAULT 0,
  max_sessions_per_period INTEGER,
  period_type TEXT DEFAULT 'weekly' CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(membership_plan_id, class_id)
);

-- Enable RLS on class access permissions
ALTER TABLE public.class_access_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for class access permissions
CREATE POLICY "class_access_permissions_view"
ON public.class_access_permissions
FOR SELECT
USING (true);

CREATE POLICY "class_access_permissions_manage"
ON public.class_access_permissions
FOR ALL
USING (get_current_user_role() IN ('admin', 'owner'));

-- Update class enrollments to reference membership subscriptions
ALTER TABLE public.class_enrollments ADD COLUMN IF NOT EXISTS membership_subscription_id UUID REFERENCES public.membership_subscriptions(id);
ALTER TABLE public.class_enrollments ADD COLUMN IF NOT EXISTS enrollment_type TEXT DEFAULT 'membership' CHECK (enrollment_type IN ('membership', 'drop_in', 'trial', 'guest'));

-- Create billing cycles table
CREATE TABLE public.billing_cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  membership_subscription_id UUID NOT NULL REFERENCES public.membership_subscriptions(id) ON DELETE CASCADE,
  cycle_start_date DATE NOT NULL,
  cycle_end_date DATE NOT NULL,
  amount_cents INTEGER NOT NULL,
  discount_applied_cents INTEGER DEFAULT 0,
  tax_amount_cents INTEGER DEFAULT 0,
  total_amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
  due_date DATE NOT NULL,
  paid_date DATE,
  payment_method TEXT,
  stripe_invoice_id TEXT,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  next_retry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on billing cycles
ALTER TABLE public.billing_cycles ENABLE ROW LEVEL SECURITY;

-- Create policies for billing cycles
CREATE POLICY "billing_cycles_academy_isolation"
ON public.billing_cycles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM membership_subscriptions ms
    JOIN academy_memberships am1 ON ms.contact_id = am1.user_id
    JOIN academy_memberships am2 ON am1.academy_id = am2.academy_id
    WHERE ms.id = billing_cycles.membership_subscription_id
    AND am2.user_id = auth.uid()
    AND am1.is_active = true 
    AND am2.is_active = true
  ) OR
  get_current_user_role() IN ('admin', 'owner')
);

-- Create function to calculate membership access for a contact
CREATE OR REPLACE FUNCTION public.get_contact_class_access(contact_uuid UUID)
RETURNS TABLE(
  class_id UUID,
  class_name TEXT,
  access_type TEXT,
  additional_fee_cents INTEGER,
  max_sessions_per_period INTEGER,
  period_type TEXT
)
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT 
    c.id as class_id,
    c.name as class_name,
    COALESCE(cap.access_type, 'restricted') as access_type,
    COALESCE(cap.additional_fee_cents, 0) as additional_fee_cents,
    cap.max_sessions_per_period,
    cap.period_type
  FROM classes c
  LEFT JOIN class_access_permissions cap ON c.id = cap.class_id
  LEFT JOIN membership_subscriptions ms ON cap.membership_plan_id = ms.membership_plan_id
  WHERE c.is_active = true
  AND (ms.contact_id = contact_uuid AND ms.status = 'active')
  OR cap.access_type = 'additional_fee'
  ORDER BY c.name;
$$;

-- Create function to get family members
CREATE OR REPLACE FUNCTION public.get_family_members(contact_uuid UUID)
RETURNS TABLE(
  contact_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  relationship_type TEXT,
  is_primary BOOLEAN
)
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT 
    p.id as contact_id,
    p.first_name,
    p.last_name,
    p.email,
    fr.relationship_type,
    fr.is_primary_contact as is_primary
  FROM family_relationships fr
  JOIN profiles p ON (
    (fr.primary_contact_id = contact_uuid AND p.id = fr.related_contact_id) OR
    (fr.related_contact_id = contact_uuid AND p.id = fr.primary_contact_id)
  )
  WHERE fr.primary_contact_id = contact_uuid OR fr.related_contact_id = contact_uuid
  ORDER BY fr.is_primary_contact DESC, p.first_name;
$$;

-- Create triggers for updating timestamps
CREATE TRIGGER update_family_relationships_updated_at
BEFORE UPDATE ON public.family_relationships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_membership_subscriptions_updated_at
BEFORE UPDATE ON public.membership_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_billing_cycles_updated_at
BEFORE UPDATE ON public.billing_cycles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create billing cycles
CREATE OR REPLACE FUNCTION public.create_next_billing_cycle(subscription_uuid UUID)
RETURNS UUID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  subscription_record RECORD;
  new_cycle_id UUID;
  cycle_start DATE;
  cycle_end DATE;
BEGIN
  -- Get subscription details
  SELECT ms.*, mp.billing_cycle, mp.price_cents
  INTO subscription_record
  FROM membership_subscriptions ms
  JOIN membership_plans mp ON ms.membership_plan_id = mp.id
  WHERE ms.id = subscription_uuid;

  IF subscription_record IS NULL THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;

  -- Calculate cycle dates
  cycle_start := subscription_record.next_billing_date;
  
  CASE subscription_record.billing_cycle
    WHEN 'weekly' THEN cycle_end := cycle_start + INTERVAL '7 days';
    WHEN 'monthly' THEN cycle_end := cycle_start + INTERVAL '1 month';
    WHEN 'quarterly' THEN cycle_end := cycle_start + INTERVAL '3 months';
    WHEN 'annually' THEN cycle_end := cycle_start + INTERVAL '1 year';
    ELSE cycle_end := cycle_start + INTERVAL '1 month';
  END CASE;

  -- Create billing cycle
  INSERT INTO billing_cycles (
    membership_subscription_id,
    cycle_start_date,
    cycle_end_date,
    amount_cents,
    discount_applied_cents,
    total_amount_cents,
    due_date
  ) VALUES (
    subscription_uuid,
    cycle_start,
    cycle_end,
    subscription_record.billing_amount_cents,
    (subscription_record.billing_amount_cents * subscription_record.discount_percentage / 100)::INTEGER,
    subscription_record.billing_amount_cents - (subscription_record.billing_amount_cents * subscription_record.discount_percentage / 100)::INTEGER,
    cycle_start
  ) RETURNING id INTO new_cycle_id;

  -- Update next billing date
  UPDATE membership_subscriptions 
  SET next_billing_date = cycle_end 
  WHERE id = subscription_uuid;

  RETURN new_cycle_id;
END;
$$;