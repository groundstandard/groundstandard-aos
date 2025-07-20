-- Comprehensive update to allow both admin and owner roles across all tables

-- Classes and class management
DROP POLICY IF EXISTS "Admins can manage all classes" ON public.classes;
CREATE POLICY "Admins and owners can manage all classes" ON public.classes
FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

DROP POLICY IF EXISTS "Admins can manage class schedules" ON public.class_schedules;
CREATE POLICY "Admins and owners can manage class schedules" ON public.class_schedules
FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.class_enrollments;
CREATE POLICY "Admins and owners can manage enrollments" ON public.class_enrollments
FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

-- Attendance management
DROP POLICY IF EXISTS "Admins can manage all attendance" ON public.attendance;
CREATE POLICY "Admins and owners can manage all attendance" ON public.attendance
FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

-- Belt testing
DROP POLICY IF EXISTS "Admins can manage all belt tests" ON public.belt_tests;
CREATE POLICY "Admins and owners can manage all belt tests" ON public.belt_tests
FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

-- Events management
DROP POLICY IF EXISTS "Admins can manage all events" ON public.events;
CREATE POLICY "Admins and owners can manage all events" ON public.events
FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

DROP POLICY IF EXISTS "Admins can manage all event registrations" ON public.event_registrations;
CREATE POLICY "Admins and owners can manage all event registrations" ON public.event_registrations
FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

-- Payment and financial management
DROP POLICY IF EXISTS "Admins can manage all payment links" ON public.payment_links;
CREATE POLICY "Admins and owners can manage all payment links" ON public.payment_links
FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

DROP POLICY IF EXISTS "Admins can manage all late fees" ON public.late_fees;
CREATE POLICY "Admins and owners can manage all late fees" ON public.late_fees
FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

DROP POLICY IF EXISTS "Admins can manage payment plans" ON public.payment_plans;
CREATE POLICY "Admins and owners can manage payment plans" ON public.payment_plans
FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

DROP POLICY IF EXISTS "Admins can manage payment analytics" ON public.payment_analytics;
CREATE POLICY "Admins and owners can manage payment analytics" ON public.payment_analytics
FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

-- Communication and automation
DROP POLICY IF EXISTS "Admins can manage automated messages" ON public.automated_messages;
CREATE POLICY "Admins and owners can manage automated messages" ON public.automated_messages
FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

DROP POLICY IF EXISTS "Admins can manage automation settings" ON public.automation_settings;
CREATE POLICY "Admins and owners can manage automation settings" ON public.automation_settings
FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

DROP POLICY IF EXISTS "Admins can manage all communication logs" ON public.communication_logs;
CREATE POLICY "Admins and owners can manage all communication logs" ON public.communication_logs
FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

DROP POLICY IF EXISTS "Admins can manage message templates" ON public.message_templates;
CREATE POLICY "Admins and owners can manage message templates" ON public.message_templates
FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

DROP POLICY IF EXISTS "Admins can manage email templates" ON public.email_templates;
CREATE POLICY "Admins and owners can manage email templates" ON public.email_templates
FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

-- Contact and family management
DROP POLICY IF EXISTS "Admins can manage family discounts" ON public.family_discounts;
CREATE POLICY "Admins and owners can manage family discounts" ON public.family_discounts
FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

DROP POLICY IF EXISTS "Admins can manage family relationships" ON public.family_relationships;
CREATE POLICY "Admins and owners can manage family relationships" ON public.family_relationships
FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

DROP POLICY IF EXISTS "Admins can manage contact activities" ON public.contact_activities;
CREATE POLICY "Admins and owners can manage contact activities" ON public.contact_activities
FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

DROP POLICY IF EXISTS "Admins can manage contact imports" ON public.contact_imports;
CREATE POLICY "Admins and owners can manage contact imports" ON public.contact_imports
FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

-- Audit and reporting
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins and owners can view audit logs" ON public.audit_logs
FOR SELECT USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

DROP POLICY IF EXISTS "Admins can view automation logs" ON public.automation_logs;
CREATE POLICY "Admins and owners can view automation logs" ON public.automation_logs
FOR SELECT USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

DROP POLICY IF EXISTS "Admins can manage export logs" ON public.export_logs;
CREATE POLICY "Admins and owners can manage export logs" ON public.export_logs
FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

DROP POLICY IF EXISTS "Admins can manage financial reports" ON public.financial_reports;
CREATE POLICY "Admins and owners can manage financial reports" ON public.financial_reports
FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

-- Inventory management
DROP POLICY IF EXISTS "Admins can manage inventory" ON public.inventory;
CREATE POLICY "Admins and owners can manage inventory" ON public.inventory
FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));

-- Membership plan types 
DROP POLICY IF EXISTS "Admins can manage membership plan types" ON public.membership_plan_types;
CREATE POLICY "Admins and owners can manage membership plan types" ON public.membership_plan_types
FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'owner'::text]));