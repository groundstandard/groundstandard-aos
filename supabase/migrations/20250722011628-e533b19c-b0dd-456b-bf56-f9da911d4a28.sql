-- Phase 2: Update ALL RLS policies to prevent data leakage between academies
-- This is CRITICAL for data isolation

-- Update profiles table policies to use academy memberships
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;

CREATE POLICY "profiles_select_multi_academy" 
ON public.profiles FOR SELECT 
USING (
    -- Users can see their own profile
    auth.uid() = id 
    OR 
    -- Users can see profiles of people in their academies
    EXISTS (
        SELECT 1 FROM public.academy_memberships am1
        JOIN public.academy_memberships am2 ON am1.academy_id = am2.academy_id
        WHERE am1.user_id = auth.uid() 
        AND am2.user_id = profiles.id
        AND am1.is_active = true 
        AND am2.is_active = true
    )
);

CREATE POLICY "profiles_update_multi_academy" 
ON public.profiles FOR UPDATE 
USING (
    -- Users can update their own profile
    auth.uid() = id 
    OR 
    -- Academy owners/admins can update profiles in their academy
    EXISTS (
        SELECT 1 FROM public.academy_memberships am1
        JOIN public.academy_memberships am2 ON am1.academy_id = am2.academy_id
        WHERE am1.user_id = auth.uid() 
        AND am2.user_id = profiles.id
        AND am1.role IN ('owner', 'admin')
        AND am1.is_active = true 
        AND am2.is_active = true
    )
);

CREATE POLICY "profiles_insert_own" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Update attendance table policies for academy isolation
DROP POLICY IF EXISTS "Admins and owners can manage all attendance" ON public.attendance;
DROP POLICY IF EXISTS "Students can view their own attendance" ON public.attendance;

CREATE POLICY "attendance_academy_isolation" 
ON public.attendance FOR ALL
USING (
    -- Users can see their own attendance
    auth.uid() = student_id 
    OR 
    -- Academy members can see attendance of students in their academy
    EXISTS (
        SELECT 1 FROM public.academy_memberships am1
        JOIN public.academy_memberships am2 ON am1.academy_id = am2.academy_id
        WHERE am1.user_id = auth.uid() 
        AND am2.user_id = attendance.student_id
        AND am1.is_active = true 
        AND am2.is_active = true
    )
);

-- Update payments table policies for academy isolation  
DROP POLICY IF EXISTS "Admins and owners can manage all payments" ON public.payments;
DROP POLICY IF EXISTS "Students can view their own payments" ON public.payments;

CREATE POLICY "payments_academy_isolation" 
ON public.payments FOR ALL
USING (
    -- Users can see their own payments
    auth.uid() = student_id 
    OR 
    -- Academy members can see payments of students in their academy
    EXISTS (
        SELECT 1 FROM public.academy_memberships am1
        JOIN public.academy_memberships am2 ON am1.academy_id = am2.academy_id
        WHERE am1.user_id = auth.uid() 
        AND am2.user_id = payments.student_id
        AND am1.is_active = true 
        AND am2.is_active = true
    )
);

-- Update belt_tests table policies for academy isolation
DROP POLICY IF EXISTS "Admins and owners can manage all belt tests" ON public.belt_tests;
DROP POLICY IF EXISTS "Students can view their own belt tests" ON public.belt_tests;

CREATE POLICY "belt_tests_academy_isolation" 
ON public.belt_tests FOR ALL
USING (
    -- Users can see their own belt tests
    auth.uid() = student_id 
    OR 
    -- Academy members can see belt tests of students in their academy
    EXISTS (
        SELECT 1 FROM public.academy_memberships am1
        JOIN public.academy_memberships am2 ON am1.academy_id = am2.academy_id
        WHERE am1.user_id = auth.uid() 
        AND am2.user_id = belt_tests.student_id
        AND am1.is_active = true 
        AND am2.is_active = true
    )
);

-- Update class_enrollments table policies for academy isolation
DROP POLICY IF EXISTS "Admins and owners can manage enrollments" ON public.class_enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.class_enrollments;
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.class_enrollments;

CREATE POLICY "class_enrollments_academy_isolation" 
ON public.class_enrollments FOR ALL
USING (
    -- Users can see their own enrollments
    auth.uid() = student_id 
    OR 
    -- Academy members can see enrollments of students in their academy
    EXISTS (
        SELECT 1 FROM public.academy_memberships am1
        JOIN public.academy_memberships am2 ON am1.academy_id = am2.academy_id
        WHERE am1.user_id = auth.uid() 
        AND am2.user_id = class_enrollments.student_id
        AND am1.is_active = true 
        AND am2.is_active = true
    )
);

-- Update communication_logs table policies for academy isolation
DROP POLICY IF EXISTS "Admins and owners can manage all communication logs" ON public.communication_logs;
DROP POLICY IF EXISTS "Users can view their own communication logs" ON public.communication_logs;

CREATE POLICY "communication_logs_academy_isolation" 
ON public.communication_logs FOR ALL
USING (
    -- Users can see their own communication logs
    auth.uid() = contact_id 
    OR 
    -- Academy members can see communication logs of contacts in their academy
    EXISTS (
        SELECT 1 FROM public.academy_memberships am1
        JOIN public.academy_memberships am2 ON am1.academy_id = am2.academy_id
        WHERE am1.user_id = auth.uid() 
        AND am2.user_id = communication_logs.contact_id
        AND am1.is_active = true 
        AND am2.is_active = true
    )
);