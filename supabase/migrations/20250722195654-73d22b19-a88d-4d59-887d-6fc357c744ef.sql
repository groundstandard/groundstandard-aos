-- First, clean up foreign key references
DELETE FROM academy_switches WHERE from_academy_id IN (
  SELECT id FROM academies WHERE name != 'Try A Martial Art'
) OR to_academy_id IN (
  SELECT id FROM academies WHERE name != 'Try A Martial Art'
);

DELETE FROM academy_memberships WHERE academy_id IN (
  SELECT id FROM academies WHERE name != 'Try A Martial Art'
);

DELETE FROM academy_subscriptions WHERE academy_id IN (
  SELECT id FROM academies WHERE name != 'Try A Martial Art'
);

DELETE FROM academy_setup_progress WHERE academy_id IN (
  SELECT id FROM academies WHERE name != 'Try A Martial Art'
);

DELETE FROM academy_invitations WHERE academy_id IN (
  SELECT id FROM academies WHERE name != 'Try A Martial Art'
);

-- Update profiles to remove references to deleted academies
UPDATE profiles 
SET academy_id = NULL, last_academy_id = NULL 
WHERE academy_id IN (
  SELECT id FROM academies WHERE name != 'Try A Martial Art'
);

-- Now delete academies except "Try A Martial Art"
DELETE FROM academies WHERE name != 'Try A Martial Art';

-- Set up bobby@groundstandard.com as owner and student for both "Try A Martial Art" academies
-- First, update the profile to be owner of the first academy
UPDATE profiles 
SET role = 'owner', 
    academy_id = '4512f5ed-d766-48e0-8bb1-4ffa1e4a7445',
    last_academy_id = '4512f5ed-d766-48e0-8bb1-4ffa1e4a7445'
WHERE email = 'bobby@groundstandard.com';

-- Add academy memberships for both academies
INSERT INTO academy_memberships (user_id, academy_id, role, is_active) VALUES
-- Owner role for first academy
('8d34716f-092c-42ed-af18-5d70dee50441', '4512f5ed-d766-48e0-8bb1-4ffa1e4a7445', 'owner', true),
-- Student role for first academy  
('8d34716f-092c-42ed-af18-5d70dee50441', '4512f5ed-d766-48e0-8bb1-4ffa1e4a7445', 'student', true),
-- Owner role for second academy
('8d34716f-092c-42ed-af18-5d70dee50441', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', 'owner', true),
-- Student role for second academy
('8d34716f-092c-42ed-af18-5d70dee50441', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', 'student', true)
ON CONFLICT (user_id, academy_id, role) DO NOTHING;