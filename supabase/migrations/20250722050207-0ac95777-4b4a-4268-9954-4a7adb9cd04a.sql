-- Let's just create some test attendance records using your existing profile
-- First, make sure you have the instructor role for some classes
UPDATE public.classes 
SET instructor_id = '8d34716f-092c-42ed-af18-5d70dee50441'
WHERE instructor_id IS NULL;

-- Create some attendance records for you (as both student and instructor for testing)
INSERT INTO public.attendance (student_id, class_id, date, status, notes)
SELECT 
  '8d34716f-092c-42ed-af18-5d70dee50441',
  c.id,
  CURRENT_DATE - ((gs.i)::int),
  CASE WHEN random() > 0.3 THEN 'present' ELSE 'absent' END,
  CASE 
    WHEN random() > 0.8 THEN 'Great session!' 
    WHEN random() > 0.6 THEN 'Good progress'
    ELSE NULL 
  END
FROM classes c
CROSS JOIN generate_series(0, 5) as gs(i)
WHERE c.name IN ('Beginner Karate', 'Advanced BJJ', 'Youth Taekwondo')
AND random() > 0.3;

-- Also create some enrollments for you
INSERT INTO public.class_enrollments (student_id, class_id, status)
SELECT 
  '8d34716f-092c-42ed-af18-5d70dee50441',
  id,
  'active'
FROM classes 
WHERE name IN ('Beginner Karate', 'Advanced BJJ', 'Youth Taekwondo')
ON CONFLICT (student_id, class_id) DO NOTHING;