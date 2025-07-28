-- First check and remove any duplicate academy memberships to clean up
DELETE FROM academy_memberships 
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id, academy_id) id 
    FROM academy_memberships 
    ORDER BY user_id, academy_id, joined_at DESC
);

-- Associate test contacts with NY Academy for testing
INSERT INTO academy_memberships (user_id, academy_id, role, is_active) 
SELECT '00000000-0000-0000-0000-000000000067', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', 'student', true
WHERE NOT EXISTS (
    SELECT 1 FROM academy_memberships 
    WHERE user_id = '00000000-0000-0000-0000-000000000067' 
    AND academy_id = '90b44e8b-c33a-4a98-bc3c-e9a18f434630'
);

INSERT INTO academy_memberships (user_id, academy_id, role, is_active) 
SELECT '00000000-0000-0000-0000-000000000068', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', 'student', true
WHERE NOT EXISTS (
    SELECT 1 FROM academy_memberships 
    WHERE user_id = '00000000-0000-0000-0000-000000000068' 
    AND academy_id = '90b44e8b-c33a-4a98-bc3c-e9a18f434630'
);