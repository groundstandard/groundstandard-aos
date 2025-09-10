-- Simple RLS enforcement for remaining public tables

-- 1) Force RLS on all tables mentioned in security scan
ALTER TABLE public.subscribers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_connected_accounts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.academies FORCE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- 2) Force RLS on tables that may exist
DO $$
BEGIN
    -- Force RLS on payment_transactions if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_transactions') THEN
        ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.payment_transactions FORCE ROW LEVEL SECURITY;
    END IF;
    
    -- Force RLS on membership_plans
    ALTER TABLE public.membership_plans FORCE ROW LEVEL SECURITY;
    
    -- Force RLS on belt_progressions
    ALTER TABLE public.belt_progressions FORCE ROW LEVEL SECURITY;
    
    -- Force RLS on class_schedules
    ALTER TABLE public.class_schedules FORCE ROW LEVEL SECURITY;
END $$;