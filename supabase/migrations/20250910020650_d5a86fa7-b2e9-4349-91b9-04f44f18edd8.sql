-- Secure financial data with strict RLS

-- 1) Invoices: enable RLS and add least-privileged policies
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;

CREATE POLICY "Users can view their own invoices"
ON public.invoices
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own invoices"
ON public.invoices
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage invoices"
ON public.invoices
FOR ALL
TO authenticated
USING (public.get_current_user_role() IN ('admin','owner'))
WITH CHECK (public.get_current_user_role() IN ('admin','owner'));

-- 2) Payment schedule: enable RLS and scope by subscriber or admin
ALTER TABLE public.payment_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own payment schedule" ON public.payment_schedule;
DROP POLICY IF EXISTS "Admins can manage payment schedule" ON public.payment_schedule;

CREATE POLICY "Users can view their own payment schedule"
ON public.payment_schedule
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.membership_subscriptions ms
    WHERE ms.id = payment_schedule.membership_subscription_id
      AND ms.profile_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage payment schedule"
ON public.payment_schedule
FOR ALL
TO authenticated
USING (public.get_current_user_role() IN ('admin','owner'))
WITH CHECK (public.get_current_user_role() IN ('admin','owner'));

-- 3) Lock down internal Stripe events to service role only (no user access)
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stripe_events_service_role" ON public.stripe_events;

-- Explicit deny for anon/authenticated to avoid accidental access and linter noise
DROP POLICY IF EXISTS "No public access to stripe_events" ON public.stripe_events;
DROP POLICY IF EXISTS "No authenticated access to stripe_events" ON public.stripe_events;
CREATE POLICY "No public access to stripe_events"
ON public.stripe_events
FOR ALL
TO anon
USING (false)
WITH CHECK (false);
CREATE POLICY "No authenticated access to stripe_events"
ON public.stripe_events
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- 4) Lock down subscription_events similarly
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Edge functions can manage events" ON public.subscription_events;
DROP POLICY IF EXISTS "No public access to subscription_events" ON public.subscription_events;
DROP POLICY IF EXISTS "No authenticated access to subscription_events" ON public.subscription_events;
CREATE POLICY "No public access to subscription_events"
ON public.subscription_events
FOR ALL
TO anon
USING (false)
WITH CHECK (false);
CREATE POLICY "No authenticated access to subscription_events"
ON public.subscription_events
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- 5) Payment transactions: remove permissive write policy; keep select-own policy already present
DROP POLICY IF EXISTS "Edge functions can manage transactions" ON public.payment_transactions;
-- Optional explicit deny of writes by authenticated users (service role bypasses RLS)
DROP POLICY IF EXISTS "Deny inserts for payment_transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Deny updates for payment_transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Deny deletes for payment_transactions" ON public.payment_transactions;
CREATE POLICY "Deny inserts for payment_transactions"
ON public.payment_transactions
FOR INSERT
TO authenticated
WITH CHECK (false);
CREATE POLICY "Deny updates for payment_transactions"
ON public.payment_transactions
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);
CREATE POLICY "Deny deletes for payment_transactions"
ON public.payment_transactions
FOR DELETE
TO authenticated
USING (false);
