-- Create some classes for attendance tracking
INSERT INTO public.classes (id, name, description, instructor_id, max_students, is_active, duration_minutes) VALUES 
  ('00000000-1111-2222-3333-000000000001', 'Beginner Karate', 'Basic karate techniques for beginners', '00000000-0000-0000-0000-000000000002', 20, true, 60),
  ('00000000-1111-2222-3333-000000000002', 'Advanced Sparring', 'Advanced sparring and techniques', '00000000-0000-0000-0000-000000000010', 15, true, 90),
  ('00000000-1111-2222-3333-000000000003', 'Kids Program', 'Karate for children ages 6-12', '00000000-0000-0000-0000-000000000010', 25, true, 45)
ON CONFLICT (id) DO NOTHING;

-- Create class schedules
INSERT INTO public.class_schedules (class_id, day_of_week, start_time, end_time) VALUES 
  ('00000000-1111-2222-3333-000000000001', 1, '18:00:00', '19:00:00'), -- Monday 6-7 PM
  ('00000000-1111-2222-3333-000000000001', 3, '18:00:00', '19:00:00'), -- Wednesday 6-7 PM
  ('00000000-1111-2222-3333-000000000002', 2, '19:30:00', '21:00:00'), -- Tuesday 7:30-9 PM
  ('00000000-1111-2222-3333-000000000002', 4, '19:30:00', '21:00:00'), -- Thursday 7:30-9 PM
  ('00000000-1111-2222-3333-000000000003', 6, '10:00:00', '10:45:00'), -- Saturday 10-10:45 AM
  ('00000000-1111-2222-3333-000000000003', 6, '11:00:00', '11:45:00')  -- Saturday 11-11:45 AM
ON CONFLICT (class_id, day_of_week, start_time) DO NOTHING;

-- Create some attendance records for testing
INSERT INTO public.attendance (student_id, class_id, date, status, notes) VALUES 
  ('00000000-0000-0000-0000-000000000001', '00000000-1111-2222-3333-000000000001', CURRENT_DATE, 'present', 'Great participation'),
  ('00000000-0000-0000-0000-000000000003', '00000000-1111-2222-3333-000000000001', CURRENT_DATE, 'present', 'Excellent form'),
  ('00000000-0000-0000-0000-000000000006', '00000000-1111-2222-3333-000000000002', CURRENT_DATE, 'late', 'Arrived 10 minutes late'),
  ('00000000-0000-0000-0000-000000000007', '00000000-1111-2222-3333-000000000003', CURRENT_DATE, 'present', 'Good focus'),
  ('00000000-0000-0000-0000-000000000008', '00000000-1111-2222-3333-000000000001', CURRENT_DATE - INTERVAL '1 day', 'absent', 'Sick'),
  ('00000000-0000-0000-0000-000000000009', '00000000-1111-2222-3333-000000000002', CURRENT_DATE - INTERVAL '1 day', 'present', 'Worked on kumite')
ON CONFLICT DO NOTHING;