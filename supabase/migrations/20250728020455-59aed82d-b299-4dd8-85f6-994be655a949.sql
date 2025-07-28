-- Associate test contacts with NY Academy for testing
-- Using existing profile IDs that we know exist

INSERT INTO academy_memberships (user_id, academy_id, role, is_active) 
SELECT '00000000-0000-0000-0000-000000000052', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', 'student', true
WHERE NOT EXISTS (
    SELECT 1 FROM academy_memberships 
    WHERE user_id = '00000000-0000-0000-0000-000000000052' 
    AND academy_id = '90b44e8b-c33a-4a98-bc3c-e9a18f434630'
);

INSERT INTO academy_memberships (user_id, academy_id, role, is_active) 
SELECT '00000000-0000-0000-0000-000000000002', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', 'student', true
WHERE NOT EXISTS (
    SELECT 1 FROM academy_memberships 
    WHERE user_id = '00000000-0000-0000-0000-000000000002' 
    AND academy_id = '90b44e8b-c33a-4a98-bc3c-e9a18f434630'
);

INSERT INTO academy_memberships (user_id, academy_id, role, is_active) 
SELECT '00000000-0000-0000-0000-000000000053', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', 'student', true
WHERE NOT EXISTS (
    SELECT 1 FROM academy_memberships 
    WHERE user_id = '00000000-0000-0000-0000-000000000053' 
    AND academy_id = '90b44e8b-c33a-4a98-bc3c-e9a18f434630'
);