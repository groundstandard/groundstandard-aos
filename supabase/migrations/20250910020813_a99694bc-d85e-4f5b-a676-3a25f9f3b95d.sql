-- COMPREHENSIVE SECURITY FIX: Lock down ALL exposed tables with proper RLS policies

-- 1) Profiles table: highly sensitive user data
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_access" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.get_current_user_role() IN ('admin','owner'))
WITH CHECK (public.get_current_user_role() IN ('admin','owner'));

-- 2) Payments table: financial data
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
DROP POLICY IF EXISTS "payments_admin_access" ON public.payments;

CREATE POLICY "Users can view their own payments"
ON public.payments
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Admins can manage all payments"
ON public.payments
FOR ALL
TO authenticated
USING (public.get_current_user_role() IN ('admin','owner'))
WITH CHECK (public.get_current_user_role() IN ('admin','owner'));

-- 3) Attendance table: student behavior data  
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_select_own" ON public.attendance;
DROP POLICY IF EXISTS "attendance_admin_access" ON public.attendance;

CREATE POLICY "Users can view their own attendance"
ON public.attendance
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Admins can manage all attendance"
ON public.attendance
FOR ALL
TO authenticated
USING (public.get_current_user_role() IN ('admin','owner'))
WITH CHECK (public.get_current_user_role() IN ('admin','owner'));

-- 4) Class reservations table: enrollment data
ALTER TABLE public.class_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "class_reservations_select_own" ON public.class_reservations;
DROP POLICY IF EXISTS "class_reservations_admin_access" ON public.class_reservations;

CREATE POLICY "Users can view their own reservations"
ON public.class_reservations
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Admins can manage all reservations"
ON public.class_reservations
FOR ALL
TO authenticated
USING (public.get_current_user_role() IN ('admin','owner'))
WITH CHECK (public.get_current_user_role() IN ('admin','owner'));

-- 5) Membership subscriptions: billing data
ALTER TABLE public.membership_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "membership_subscriptions_select_own" ON public.membership_subscriptions;
DROP POLICY IF EXISTS "membership_subscriptions_admin_access" ON public.membership_subscriptions;

CREATE POLICY "Users can view their own subscriptions"
ON public.membership_subscriptions
FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Users can update their own subscriptions"
ON public.membership_subscriptions
FOR UPDATE
TO authenticated
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Admins can manage all subscriptions"
ON public.membership_subscriptions
FOR ALL
TO authenticated
USING (public.get_current_user_role() IN ('admin','owner'))
WITH CHECK (public.get_current_user_role() IN ('admin','owner'));

-- 6) Billing cycles: financial payment details
ALTER TABLE public.billing_cycles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "billing_cycles_select_own" ON public.billing_cycles;
DROP POLICY IF EXISTS "billing_cycles_admin_access" ON public.billing_cycles;

CREATE POLICY "Users can view their own billing cycles"
ON public.billing_cycles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.membership_subscriptions ms
    WHERE ms.id = billing_cycles.membership_subscription_id
      AND ms.profile_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all billing cycles"
ON public.billing_cycles
FOR ALL
TO authenticated
USING (public.get_current_user_role() IN ('admin','owner'))
WITH CHECK (public.get_current_user_role() IN ('admin','owner'));

-- 7) Academies table: business information already has good RLS (keeping existing)
-- Already has: academy members view their academy, owners manage their academy

-- 8) Chat messages: private communications
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_messages_channel_access" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_sender_access" ON public.chat_messages;

CREATE POLICY "Users can view messages in their channels"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.channel_memberships cm
    WHERE cm.channel_id = chat_messages.channel_id
      AND cm.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.direct_message_channels dmc
    WHERE dmc.id = chat_messages.channel_id
      AND (dmc.user1_id = auth.uid() OR dmc.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages to their channels"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND (
    EXISTS (
      SELECT 1 FROM public.channel_memberships cm
      WHERE cm.channel_id = chat_messages.channel_id
        AND cm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.direct_message_channels dmc
      WHERE dmc.id = chat_messages.channel_id
        AND (dmc.user1_id = auth.uid() OR dmc.user2_id = auth.uid())
    )
  )
);

CREATE POLICY "Users can update their own messages"
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());