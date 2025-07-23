-- CLEAR ALL FAKE/TEST DATA FROM DATABASE

-- Delete all test profiles (keeping only real users)
DELETE FROM public.family_relationships WHERE primary_contact_id IN (
  SELECT id FROM profiles WHERE 
  email LIKE '%@test.com' OR 
  email LIKE '%test%' OR 
  email LIKE '%@email.com' OR
  email = '' OR
  first_name IN ('John', 'Jane', 'Mike', 'Sarah', 'David', 'Quinn', 'Dakota', 'Taylor', 'Cameron', 'Skyler', 'Jordan', 'Blake', 'River', 'Casey', 'Sage', 'Phoenix', 'Morgan')
);

DELETE FROM public.family_relationships WHERE related_contact_id IN (
  SELECT id FROM profiles WHERE 
  email LIKE '%@test.com' OR 
  email LIKE '%test%' OR 
  email LIKE '%@email.com' OR
  email = '' OR
  first_name IN ('John', 'Jane', 'Mike', 'Sarah', 'David', 'Quinn', 'Dakota', 'Taylor', 'Cameron', 'Skyler', 'Jordan', 'Blake', 'River', 'Casey', 'Sage', 'Phoenix', 'Morgan')
);

-- Delete attendance for test users
DELETE FROM public.attendance WHERE student_id IN (
  SELECT id FROM profiles WHERE 
  email LIKE '%@test.com' OR 
  email LIKE '%test%' OR 
  email LIKE '%@email.com' OR
  email = '' OR
  first_name IN ('John', 'Jane', 'Mike', 'Sarah', 'David', 'Quinn', 'Dakota', 'Taylor', 'Cameron', 'Skyler', 'Jordan', 'Blake', 'River', 'Casey', 'Sage', 'Phoenix', 'Morgan')
);

-- Delete class enrollments for test users
DELETE FROM public.class_enrollments WHERE student_id IN (
  SELECT id FROM profiles WHERE 
  email LIKE '%@test.com' OR 
  email LIKE '%test%' OR 
  email LIKE '%@email.com' OR
  email = '' OR
  first_name IN ('John', 'Jane', 'Mike', 'Sarah', 'David', 'Quinn', 'Dakota', 'Taylor', 'Cameron', 'Skyler', 'Jordan', 'Blake', 'River', 'Casey', 'Sage', 'Phoenix', 'Morgan')
);

-- Delete payments for test users
DELETE FROM public.payments WHERE student_id IN (
  SELECT id FROM profiles WHERE 
  email LIKE '%@test.com' OR 
  email LIKE '%test%' OR 
  email LIKE '%@email.com' OR
  email = '' OR
  first_name IN ('John', 'Jane', 'Mike', 'Sarah', 'David', 'Quinn', 'Dakota', 'Taylor', 'Cameron', 'Skyler', 'Jordan', 'Blake', 'River', 'Casey', 'Sage', 'Phoenix', 'Morgan')
);

-- Delete membership subscriptions for test users
DELETE FROM public.membership_subscriptions WHERE profile_id IN (
  SELECT id FROM profiles WHERE 
  email LIKE '%@test.com' OR 
  email LIKE '%test%' OR 
  email LIKE '%@email.com' OR
  email = '' OR
  first_name IN ('John', 'Jane', 'Mike', 'Sarah', 'David', 'Quinn', 'Dakota', 'Taylor', 'Cameron', 'Skyler', 'Jordan', 'Blake', 'River', 'Casey', 'Sage', 'Phoenix', 'Morgan')
);

-- Delete academy memberships for test users
DELETE FROM public.academy_memberships WHERE user_id IN (
  SELECT id FROM profiles WHERE 
  email LIKE '%@test.com' OR 
  email LIKE '%test%' OR 
  email LIKE '%@email.com' OR
  email = '' OR
  first_name IN ('John', 'Jane', 'Mike', 'Sarah', 'David', 'Quinn', 'Dakota', 'Taylor', 'Cameron', 'Skyler', 'Jordan', 'Blake', 'River', 'Casey', 'Sage', 'Phoenix', 'Morgan')
);

-- Delete test profiles
DELETE FROM public.profiles WHERE 
  email LIKE '%@test.com' OR 
  email LIKE '%test%' OR 
  email LIKE '%@email.com' OR
  email = '' OR
  first_name IN ('John', 'Jane', 'Mike', 'Sarah', 'David', 'Quinn', 'Dakota', 'Taylor', 'Cameron', 'Skyler', 'Jordan', 'Blake', 'River', 'Casey', 'Sage', 'Phoenix', 'Morgan');

-- Delete test classes that might have fake instructors
DELETE FROM public.class_schedules WHERE class_id IN (
  SELECT id FROM classes WHERE instructor_id NOT IN (
    SELECT id FROM profiles WHERE email = 'bobby@groundstandard.com'
  )
);

DELETE FROM public.classes WHERE instructor_id NOT IN (
  SELECT id FROM profiles WHERE email = 'bobby@groundstandard.com'
);

-- Clean up any orphaned data
DELETE FROM public.attendance WHERE student_id NOT IN (SELECT id FROM profiles);
DELETE FROM public.class_enrollments WHERE student_id NOT IN (SELECT id FROM profiles);
DELETE FROM public.payments WHERE student_id NOT IN (SELECT id FROM profiles);
DELETE FROM public.membership_subscriptions WHERE profile_id NOT IN (SELECT id FROM profiles);
DELETE FROM public.academy_memberships WHERE user_id NOT IN (SELECT id FROM profiles);