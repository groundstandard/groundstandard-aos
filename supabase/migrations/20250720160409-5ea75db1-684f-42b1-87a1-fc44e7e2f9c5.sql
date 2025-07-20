-- Add flexible cycle lengths and payment frequencies to membership system
-- Update membership_plans to support custom cycle lengths and payment frequencies
ALTER TABLE public.membership_plans 
ADD COLUMN cycle_length_months INTEGER DEFAULT 1,
ADD COLUMN payment_frequency TEXT DEFAULT 'monthly' CHECK (payment_frequency IN ('monthly', 'bi_monthly', 'quarterly', 'annually')),
ADD COLUMN is_class_pack BOOLEAN DEFAULT false,
ADD COLUMN class_pack_size INTEGER DEFAULT NULL,
ADD COLUMN pack_expiry_days INTEGER DEFAULT NULL;

-- Update existing plans to have proper cycle lengths
UPDATE public.membership_plans 
SET cycle_length_months = CASE 
    WHEN billing_cycle = 'weekly' THEN 1
    WHEN billing_cycle = 'monthly' THEN 1
    WHEN billing_cycle = 'quarterly' THEN 3
    WHEN billing_cycle = 'annual' THEN 12
    ELSE 1
END;

-- Create class_packs table for individual class pack purchases
CREATE TABLE IF NOT EXISTS public.class_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    membership_plan_id UUID NOT NULL REFERENCES membership_plans(id),
    total_classes INTEGER NOT NULL,
    remaining_classes INTEGER NOT NULL,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'exhausted', 'paused')),
    auto_renewal BOOLEAN DEFAULT false,
    renewal_discount_percentage INTEGER DEFAULT 0,
    stripe_subscription_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create class_pack_usage table to track individual class usage
CREATE TABLE IF NOT EXISTS public.class_pack_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_pack_id UUID NOT NULL REFERENCES class_packs(id) ON DELETE CASCADE,
    attendance_id UUID REFERENCES attendance(id),
    used_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_class_packs_profile_id ON class_packs(profile_id);
CREATE INDEX IF NOT EXISTS idx_class_packs_status ON class_packs(status);
CREATE INDEX IF NOT EXISTS idx_class_packs_expiry_date ON class_packs(expiry_date);
CREATE INDEX IF NOT EXISTS idx_class_pack_usage_pack_id ON class_pack_usage(class_pack_id);
CREATE INDEX IF NOT EXISTS idx_class_pack_usage_attendance_id ON class_pack_usage(attendance_id);

-- Enable RLS
ALTER TABLE public.class_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_pack_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for class_packs
CREATE POLICY "Users can view their own class packs" 
ON public.class_packs 
FOR SELECT 
USING (profile_id = auth.uid());

CREATE POLICY "Admins and owners can manage all class packs" 
ON public.class_packs 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

-- Create RLS policies for class_pack_usage
CREATE POLICY "Users can view their own class pack usage" 
ON public.class_pack_usage 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM class_packs 
    WHERE class_packs.id = class_pack_usage.class_pack_id 
    AND class_packs.profile_id = auth.uid()
));

CREATE POLICY "Admins and owners can manage all class pack usage" 
ON public.class_pack_usage 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

-- Add triggers for updating timestamps
CREATE TRIGGER update_class_packs_updated_at
    BEFORE UPDATE ON public.class_packs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to process class pack attendance and decrement classes
CREATE OR REPLACE FUNCTION public.process_class_pack_attendance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    active_pack RECORD;
BEGIN
    -- Only process for 'present' attendance
    IF NEW.status = 'present' THEN
        -- Find the most recent active class pack for this student
        SELECT * INTO active_pack
        FROM class_packs
        WHERE profile_id = NEW.student_id
        AND status = 'active'
        AND remaining_classes > 0
        AND expiry_date >= CURRENT_DATE
        ORDER BY purchase_date ASC
        LIMIT 1;
        
        IF active_pack.id IS NOT NULL THEN
            -- Decrement remaining classes
            UPDATE class_packs
            SET remaining_classes = remaining_classes - 1,
                status = CASE 
                    WHEN remaining_classes - 1 <= 0 THEN 'exhausted'
                    ELSE 'active'
                END,
                updated_at = now()
            WHERE id = active_pack.id;
            
            -- Record the usage
            INSERT INTO class_pack_usage (class_pack_id, attendance_id, used_date)
            VALUES (active_pack.id, NEW.id, NEW.date);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to automatically process class pack attendance
CREATE TRIGGER trigger_process_class_pack_attendance
    AFTER INSERT OR UPDATE ON public.attendance
    FOR EACH ROW
    EXECUTE FUNCTION public.process_class_pack_attendance();

-- Update membership_subscriptions to support flexible cycles
ALTER TABLE public.membership_subscriptions 
ADD COLUMN cycle_length_months INTEGER DEFAULT 12;

-- Update existing subscriptions with proper cycle lengths
UPDATE public.membership_subscriptions 
SET cycle_length_months = 12 
WHERE cycle_length_months IS NULL;