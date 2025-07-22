-- Create test students and proper attendance data

-- First, create some test student profiles
INSERT INTO public.profiles (id, email, first_name, last_name, role, academy_id, membership_status, belt_level, check_in_pin) VALUES
(gen_random_uuid(), 'student1@test.com', 'John', 'Smith', 'student', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', 'active', 'White', '1001'),
(gen_random_uuid(), 'student2@test.com', 'Jane', 'Doe', 'student', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', 'active', 'Yellow', '1002'),
(gen_random_uuid(), 'student3@test.com', 'Mike', 'Johnson', 'student', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', 'active', 'Orange', '1003'),
(gen_random_uuid(), 'student4@test.com', 'Sarah', 'Wilson', 'student', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', 'active', 'Green', '1004'),
(gen_random_uuid(), 'instructor1@test.com', 'David', 'Brown', 'instructor', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', 'active', 'Black', '2001');

-- Create academy memberships for all new users
INSERT INTO public.academy_memberships (user_id, academy_id, role, is_active)
SELECT id, academy_id, role, true
FROM profiles 
WHERE email LIKE '%@test.com';

-- Update existing classes to have the new instructor
UPDATE public.classes 
SET instructor_id = (SELECT id FROM profiles WHERE role = 'instructor' LIMIT 1)
WHERE instructor_id IS NULL;

-- Enroll students in classes
WITH student_data AS (
  SELECT id FROM profiles WHERE role = 'student' AND email LIKE '%@test.com'
),
class_data AS (
  SELECT id, name FROM classes WHERE name IN ('Beginner Karate', 'Advanced BJJ', 'Youth Taekwondo')
)
INSERT INTO public.class_enrollments (student_id, class_id, status)
SELECT 
  s.id,
  c.id,
  'active'
FROM student_data s
CROSS JOIN class_data c
WHERE 
  (c.name = 'Beginner Karate') OR
  (c.name = 'Advanced BJJ' AND s.id IN (SELECT id FROM student_data LIMIT 2)) OR
  (c.name = 'Youth Taekwondo' AND s.id IN (SELECT id FROM student_data OFFSET 1 LIMIT 3));

-- Create attendance records for the past week
WITH enrolled_students AS (
  SELECT DISTINCT ce.student_id, ce.class_id, c.name as class_name
  FROM class_enrollments ce
  JOIN classes c ON ce.class_id = c.id
  WHERE ce.status = 'active'
)
INSERT INTO public.attendance (student_id, class_id, date, status, notes)
SELECT 
  es.student_id,
  es.class_id,
  CURRENT_DATE - (FLOOR(RANDOM() * 7))::int,
  CASE WHEN RANDOM() > 0.3 THEN 'present' ELSE 'absent' END,
  CASE 
    WHEN RANDOM() > 0.8 THEN 'Great participation!' 
    WHEN RANDOM() > 0.6 THEN 'Needs improvement'
    ELSE NULL 
  END
FROM enrolled_students es
CROSS JOIN generate_series(0, 3) as day_offset
WHERE RANDOM() > 0.4;