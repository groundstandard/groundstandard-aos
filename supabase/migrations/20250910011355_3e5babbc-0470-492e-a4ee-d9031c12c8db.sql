-- Fix critical security issues by adding proper RLS policies

-- Create missing payment_methods table with proper RLS
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('card', 'bank_account')),
  card_brand TEXT,
  card_last4 TEXT,
  bank_name TEXT,
  bank_account_type TEXT,
  bank_last4 TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  academy_id UUID REFERENCES public.academies(id) ON DELETE CASCADE
);

-- Enable RLS on payment_methods
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Fix subscribers table RLS policies
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Edge functions can manage subscriptions" ON public.subscribers;

CREATE POLICY "Users can view own subscription only" ON public.subscribers
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own subscription" ON public.subscribers  
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Edge functions manage subscriptions" ON public.subscribers
FOR ALL USING (true);

-- Fix invoices table RLS policies  
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Edge functions can manage invoices" ON public.invoices;

CREATE POLICY "Users view own invoices only" ON public.invoices
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Edge functions manage invoices" ON public.invoices
FOR ALL USING (true);

-- Fix payment_schedule RLS policies
DROP POLICY IF EXISTS "Users can view their own payment schedule" ON public.payment_schedule;
DROP POLICY IF EXISTS "Admin can view all payment schedules" ON public.payment_schedule;
DROP POLICY IF EXISTS "Edge functions can manage payment schedules" ON public.payment_schedule;

CREATE POLICY "Users view own payment schedule" ON public.payment_schedule
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM membership_subscriptions ms 
    WHERE ms.id = payment_schedule.membership_subscription_id 
    AND ms.profile_id = auth.uid()
  )
);

CREATE POLICY "Academy admins view payment schedules" ON public.payment_schedule
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM membership_subscriptions ms
    JOIN academy_memberships am ON am.user_id = ms.profile_id
    WHERE ms.id = payment_schedule.membership_subscription_id
    AND am.academy_id IN (
      SELECT academy_id FROM academy_memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner') 
      AND is_active = true
    )
  )
);

CREATE POLICY "Edge functions manage payment schedules" ON public.payment_schedule
FOR ALL USING (true);

-- Fix payment_methods RLS policies
CREATE POLICY "Users view own payment methods" ON public.payment_methods
FOR SELECT USING (contact_id = auth.uid());

CREATE POLICY "Academy admins view payment methods" ON public.payment_methods
FOR SELECT USING (
  academy_id IN (
    SELECT academy_id FROM academy_memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner') 
    AND is_active = true
  )
);

CREATE POLICY "Users manage own payment methods" ON public.payment_methods
FOR ALL USING (contact_id = auth.uid());

CREATE POLICY "Edge functions manage payment methods" ON public.payment_methods
FOR ALL USING (true);

-- Fix academies table RLS policies
DROP POLICY IF EXISTS "Academy owners can manage their academy" ON public.academies;
DROP POLICY IF EXISTS "Users can view their own academy" ON public.academies;  
DROP POLICY IF EXISTS "Public can search completed academies" ON public.academies;

CREATE POLICY "Academy owners manage their academy" ON public.academies
FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Academy members view their academy" ON public.academies
FOR SELECT USING (
  id IN (
    SELECT academy_id FROM academy_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Create audit trail for sensitive data access
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view security logs" ON public.security_audit_log
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

CREATE POLICY "System logs security events" ON public.security_audit_log
FOR INSERT WITH CHECK (true);