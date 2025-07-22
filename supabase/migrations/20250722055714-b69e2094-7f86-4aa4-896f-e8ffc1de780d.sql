-- Create some classes for attendance tracking
INSERT INTO public.classes (id, name, description, instructor_id, max_students, is_active, duration_minutes) 
SELECT '00000000-1111-2222-3333-000000000001', 'Beginner Karate', 'Basic karate techniques for beginners', '00000000-0000-0000-0000-000000000002', 20, true, 60
WHERE NOT EXISTS (SELECT 1 FROM public.classes WHERE id = '00000000-1111-2222-3333-000000000001');

INSERT INTO public.classes (id, name, description, instructor_id, max_students, is_active, duration_minutes) 
SELECT '00000000-1111-2222-3333-000000000002', 'Advanced Sparring', 'Advanced sparring and techniques', '00000000-0000-0000-0000-000000000010', 15, true, 90
WHERE NOT EXISTS (SELECT 1 FROM public.classes WHERE id = '00000000-1111-2222-3333-000000000002');

INSERT INTO public.classes (id, name, description, instructor_id, max_students, is_active, duration_minutes) 
SELECT '00000000-1111-2222-3333-000000000003', 'Kids Program', 'Karate for children ages 6-12', '00000000-0000-0000-0000-000000000010', 25, true, 45
WHERE NOT EXISTS (SELECT 1 FROM public.classes WHERE id = '00000000-1111-2222-3333-000000000003');

-- Create class schedules
INSERT INTO public.class_schedules (class_id, day_of_week, start_time, end_time) 
SELECT '00000000-1111-2222-3333-000000000001', 1, '18:00:00', '19:00:00'
WHERE NOT EXISTS (SELECT 1 FROM public.class_schedules WHERE class_id = '00000000-1111-2222-3333-000000000001' AND day_of_week = 1);

INSERT INTO public.class_schedules (class_id, day_of_week, start_time, end_time) 
SELECT '00000000-1111-2222-3333-000000000001', 3, '18:00:00', '19:00:00'
WHERE NOT EXISTS (SELECT 1 FROM public.class_schedules WHERE class_id = '00000000-1111-2222-3333-000000000001' AND day_of_week = 3);

-- Create some attendance records for testing
INSERT INTO public.attendance (student_id, class_id, date, status, notes) 
SELECT '00000000-0000-0000-0000-000000000001', '00000000-1111-2222-3333-000000000001', CURRENT_DATE, 'present', 'Great participation'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance 
  WHERE student_id = '00000000-0000-0000-0000-000000000001' 
  AND class_id = '00000000-1111-2222-3333-000000000001' 
  AND date = CURRENT_DATE
);

INSERT INTO public.attendance (student_id, class_id, date, status, notes) 
SELECT '00000000-0000-0000-0000-000000000003', '00000000-1111-2222-3333-000000000001', CURRENT_DATE, 'present', 'Excellent form'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance 
  WHERE student_id = '00000000-0000-0000-0000-000000000003' 
  AND class_id = '00000000-1111-2222-3333-000000000001' 
  AND date = CURRENT_DATE
);