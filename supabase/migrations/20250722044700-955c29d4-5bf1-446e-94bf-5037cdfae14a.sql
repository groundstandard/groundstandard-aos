-- Ensure all attendance-related tables have proper constraints and relationships

-- First, let's make sure we have proper foreign key constraints
ALTER TABLE class_enrollments DROP CONSTRAINT IF EXISTS class_enrollments_student_id_fkey;
ALTER TABLE class_enrollments DROP CONSTRAINT IF EXISTS class_enrollments_class_id_fkey;

ALTER TABLE class_enrollments 
ADD CONSTRAINT class_enrollments_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE class_enrollments 
ADD CONSTRAINT class_enrollments_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;

-- Ensure class_schedules has proper foreign key
ALTER TABLE class_schedules DROP CONSTRAINT IF EXISTS class_schedules_class_id_fkey;
ALTER TABLE class_schedules 
ADD CONSTRAINT class_schedules_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;

-- Make sure classes.instructor_id references profiles
ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_instructor_id_fkey;
ALTER TABLE classes 
ADD CONSTRAINT classes_instructor_id_fkey 
FOREIGN KEY (instructor_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Ensure attendance table has proper foreign keys
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_student_id_fkey;
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_class_id_fkey;

ALTER TABLE attendance 
ADD CONSTRAINT attendance_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE attendance 
ADD CONSTRAINT attendance_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_class_enrollments_student_id ON class_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_class_id ON class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_status ON class_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_class_schedules_class_id ON class_schedules(class_id);
CREATE INDEX IF NOT EXISTS idx_class_schedules_day_of_week ON class_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_classes_instructor_id ON classes(instructor_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- Add a unique constraint to prevent duplicate enrollments
ALTER TABLE class_enrollments DROP CONSTRAINT IF EXISTS unique_student_class_enrollment;
ALTER TABLE class_enrollments 
ADD CONSTRAINT unique_student_class_enrollment 
UNIQUE (student_id, class_id);

-- Add a unique constraint for attendance records (one per student per class per day)
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS unique_student_class_date_attendance;
ALTER TABLE attendance 
ADD CONSTRAINT unique_student_class_date_attendance 
UNIQUE (student_id, class_id, date);

-- Update RLS policies for class_enrollments to ensure proper academy isolation
DROP POLICY IF EXISTS "class_enrollments_academy_isolation" ON class_enrollments;
CREATE POLICY "class_enrollments_academy_isolation" ON class_enrollments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM academy_memberships am1
      JOIN academy_memberships am2 ON am1.academy_id = am2.academy_id
      WHERE am1.user_id = auth.uid() 
      AND am2.user_id = class_enrollments.student_id
      AND am1.is_active = true 
      AND am2.is_active = true
    )
  );

-- Update RLS policies for class_schedules
DROP POLICY IF EXISTS "class_schedules_academy_isolation" ON class_schedules;
CREATE POLICY "class_schedules_academy_isolation" ON class_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM classes c
      JOIN academy_memberships am ON am.academy_id = 
        (SELECT academy_id FROM academy_memberships WHERE user_id = c.instructor_id LIMIT 1)
      WHERE c.id = class_schedules.class_id
      AND am.user_id = auth.uid()
      AND am.is_active = true
    )
  );

-- Function to help instructors get their classes for today
CREATE OR REPLACE FUNCTION get_instructor_classes_today(instructor_uuid uuid)
RETURNS TABLE (
  class_id uuid,
  class_name text,
  start_time time,
  end_time time,
  max_students integer,
  day_of_week integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    c.id as class_id,
    c.name as class_name,
    cs.start_time,
    cs.end_time,
    c.max_students,
    cs.day_of_week
  FROM classes c
  JOIN class_schedules cs ON c.id = cs.class_id
  WHERE c.instructor_id = instructor_uuid
  AND c.is_active = true
  AND cs.day_of_week = EXTRACT(DOW FROM CURRENT_DATE);
$$;

-- Function to get enrolled students for a class
CREATE OR REPLACE FUNCTION get_class_enrolled_students(class_uuid uuid)
RETURNS TABLE (
  student_id uuid,
  first_name text,
  last_name text,
  email text,
  belt_level text,
  enrollment_status text
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    p.id as student_id,
    p.first_name,
    p.last_name,
    p.email,
    p.belt_level,
    ce.status as enrollment_status
  FROM class_enrollments ce
  JOIN profiles p ON ce.student_id = p.id
  WHERE ce.class_id = class_uuid
  AND ce.status = 'active'
  ORDER BY p.last_name, p.first_name;
$$;