-- Create test data for attendance system

-- First, let's create some sample classes
INSERT INTO public.classes (id, name, description, instructor_id, max_students, duration_minutes, age_group, skill_level, is_active) VALUES
(gen_random_uuid(), 'Beginner Karate', 'Introduction to Karate for beginners', 
 (SELECT id FROM profiles WHERE role = 'instructor' LIMIT 1), 15, 60, 'kids', 'beginner', true),
(gen_random_uuid(), 'Advanced BJJ', 'Brazilian Jiu-Jitsu for advanced students', 
 (SELECT id FROM profiles WHERE role = 'instructor' LIMIT 1), 12, 90, 'adult', 'advanced', true),
(gen_random_uuid(), 'Youth Taekwondo', 'Taekwondo fundamentals for youth', 
 (SELECT id FROM profiles WHERE role = 'instructor' LIMIT 1), 20, 45, 'teens', 'intermediate', true);

-- Create class schedules for these classes
WITH class_data AS (
  SELECT id, name FROM classes WHERE name IN ('Beginner Karate', 'Advanced BJJ', 'Youth Taekwondo')
)
INSERT INTO public.class_schedules (class_id, day_of_week, start_time, end_time)
SELECT 
  id,
  CASE 
    WHEN name = 'Beginner Karate' THEN 1  -- Monday
    WHEN name = 'Advanced BJJ' THEN 3     -- Wednesday  
    WHEN name = 'Youth Taekwondo' THEN 5  -- Friday
  END as day_of_week,
  CASE 
    WHEN name = 'Beginner Karate' THEN '18:00:00'::time
    WHEN name = 'Advanced BJJ' THEN '19:30:00'::time
    WHEN name = 'Youth Taekwondo' THEN '17:00:00'::time
  END as start_time,
  CASE 
    WHEN name = 'Beginner Karate' THEN '19:00:00'::time
    WHEN name = 'Advanced BJJ' THEN '21:00:00'::time
    WHEN name = 'Youth Taekwondo' THEN '17:45:00'::time
  END as end_time
FROM class_data;

-- Enroll some students in these classes
WITH class_data AS (
  SELECT id, name FROM classes WHERE name IN ('Beginner Karate', 'Advanced BJJ', 'Youth Taekwondo')
),
student_data AS (
  SELECT id FROM profiles WHERE role = 'student' ORDER BY created_at LIMIT 5
)
INSERT INTO public.class_enrollments (student_id, class_id, status)
SELECT 
  s.id,
  c.id,
  'active'
FROM student_data s
CROSS JOIN class_data c
WHERE 
  (c.name = 'Beginner Karate' AND s.id IN (SELECT id FROM student_data LIMIT 3)) OR
  (c.name = 'Advanced BJJ' AND s.id IN (SELECT id FROM student_data OFFSET 1 LIMIT 2)) OR
  (c.name = 'Youth Taekwondo' AND s.id IN (SELECT id FROM student_data OFFSET 2 LIMIT 3));

-- Add some sample attendance records for the past week
WITH class_data AS (
  SELECT id, name FROM classes WHERE name IN ('Beginner Karate', 'Advanced BJJ', 'Youth Taekwondo')
),
enrolled_students AS (
  SELECT DISTINCT ce.student_id, ce.class_id 
  FROM class_enrollments ce
  JOIN class_data cd ON ce.class_id = cd.id
  WHERE ce.status = 'active'
)
INSERT INTO public.attendance (student_id, class_id, date, status, notes)
SELECT 
  es.student_id,
  es.class_id,
  CURRENT_DATE - (RANDOM() * 7)::int,
  CASE WHEN RANDOM() > 0.2 THEN 'present' ELSE 'absent' END,
  CASE WHEN RANDOM() > 0.8 THEN 'Great participation!' ELSE NULL END
FROM enrolled_students es
WHERE RANDOM() > 0.3; -- Only create attendance for ~70% of possible combinations