-- Associate test contacts with NY Academy for testing
INSERT INTO academy_memberships (user_id, academy_id, role, is_active) VALUES
('00000000-0000-0000-0000-000000000067', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', 'student', true),
('00000000-0000-0000-0000-000000000068', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', 'student', true),
('00000000-0000-0000-0000-000000000069', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', 'student', true)
ON CONFLICT (user_id, academy_id) DO NOTHING;