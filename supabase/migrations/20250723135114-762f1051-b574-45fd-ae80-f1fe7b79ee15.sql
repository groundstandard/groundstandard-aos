-- First drop the check constraint that's preventing the update
ALTER TABLE public.class_enrollments DROP CONSTRAINT IF EXISTS class_enrollments_status_check;

-- Now rename the table and update the data
ALTER TABLE public.class_enrollments RENAME TO class_reservations;

-- Update column names to match reservation terminology
ALTER TABLE public.class_reservations RENAME COLUMN enrolled_at TO reserved_at;
ALTER TABLE public.class_reservations RENAME COLUMN enrollment_type TO reservation_type;

-- Add reservation status fields
ALTER TABLE public.class_reservations 
ADD COLUMN checked_in_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN check_in_location JSONB,
ADD COLUMN no_show BOOLEAN DEFAULT false,
ADD COLUMN cancellation_reason TEXT;

-- Update status values to match new terminology
UPDATE public.class_reservations 
SET status = CASE 
  WHEN status = 'active' THEN 'reserved'
  WHEN status = 'inactive' THEN 'cancelled'
  ELSE status
END;

-- Add new check constraint with correct values
ALTER TABLE public.class_reservations 
ADD CONSTRAINT class_reservations_status_check 
CHECK (status IN ('reserved', 'cancelled', 'checked_in', 'no_show'));

-- Create class schedule versions table for historical tracking
CREATE TABLE public.class_schedule_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES public.class_schedules(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  change_reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_effective_dates CHECK (effective_to IS NULL OR effective_to > effective_from)
);

-- Create belt progressions table
CREATE TABLE public.belt_progressions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  belt_level TEXT NOT NULL,
  minimum_time_months INTEGER NOT NULL DEFAULT 3,
  minimum_classes_required INTEGER NOT NULL DEFAULT 20,
  next_belt_level TEXT,
  belt_order INTEGER NOT NULL,
  description TEXT,
  requirements JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(belt_level, belt_order)
);

-- Create student belt history table
CREATE TABLE public.student_belt_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  belt_level TEXT NOT NULL,
  promoted_date DATE NOT NULL DEFAULT CURRENT_DATE,
  promoted_by UUID REFERENCES auth.users(id),
  classes_completed_at_previous_belt INTEGER DEFAULT 0,
  time_at_previous_belt_months INTEGER DEFAULT 0,
  test_score JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comprehensive audit log table
CREATE TABLE public.audit_logs_comprehensive (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  record_identifier TEXT,
  old_values JSONB,
  new_values JSONB,
  change_summary TEXT,
  module_name TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.class_schedule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.belt_progressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_belt_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs_comprehensive ENABLE ROW LEVEL SECURITY;

-- RLS Policies for class_schedule_versions
CREATE POLICY "Academy members can view schedule versions" 
ON public.class_schedule_versions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM academy_memberships am
    JOIN classes c ON c.id = class_schedule_versions.class_id
    WHERE am.user_id = auth.uid() 
    AND am.is_active = true
  )
);

CREATE POLICY "Admins can manage schedule versions" 
ON public.class_schedule_versions 
FOR ALL 
USING (get_current_user_role() = ANY(ARRAY['admin', 'owner']));

-- RLS Policies for belt_progressions
CREATE POLICY "Everyone can view belt progressions" 
ON public.belt_progressions 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage belt progressions" 
ON public.belt_progressions 
FOR ALL 
USING (get_current_user_role() = ANY(ARRAY['admin', 'owner']));

-- RLS Policies for student_belt_history
CREATE POLICY "Students can view their own belt history" 
ON public.student_belt_history 
FOR SELECT 
USING (student_id = auth.uid());

CREATE POLICY "Academy members can view belt history within academy" 
ON public.student_belt_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM academy_memberships am1
    JOIN academy_memberships am2 ON am1.academy_id = am2.academy_id
    WHERE am1.user_id = auth.uid() 
    AND am2.user_id = student_belt_history.student_id
    AND am1.is_active = true 
    AND am2.is_active = true
  )
);

CREATE POLICY "Admins can manage belt history" 
ON public.student_belt_history 
FOR ALL 
USING (get_current_user_role() = ANY(ARRAY['admin', 'owner', 'instructor']));

-- RLS Policies for audit_logs_comprehensive
CREATE POLICY "Admins can view all audit logs" 
ON public.audit_logs_comprehensive 
FOR SELECT 
USING (get_current_user_role() = ANY(ARRAY['admin', 'owner']));

CREATE POLICY "System can insert audit logs" 
ON public.audit_logs_comprehensive 
FOR INSERT 
WITH CHECK (true);

-- Insert default belt progression data
INSERT INTO public.belt_progressions (belt_level, minimum_time_months, minimum_classes_required, next_belt_level, belt_order, description) VALUES
('White', 3, 20, 'Yellow', 1, 'Beginner level - focus on basic techniques'),
('Yellow', 4, 25, 'Orange', 2, 'Developing fundamental skills'),
('Orange', 4, 30, 'Green', 3, 'Building consistency and form'),
('Green', 6, 35, 'Blue', 4, 'Intermediate techniques and sparring'),
('Blue', 6, 40, 'Purple', 5, 'Advanced combinations and tactics'),
('Purple', 8, 45, 'Brown', 6, 'Leadership and teaching preparation'),
('Brown', 12, 60, 'Black', 7, 'Mastery of fundamentals, preparing for black belt'),
('Black', 24, 100, 'Black 2nd Degree', 8, 'Teaching and advanced technique mastery');