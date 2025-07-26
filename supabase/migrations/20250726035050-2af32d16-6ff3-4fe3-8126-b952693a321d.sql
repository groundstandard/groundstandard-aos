-- Add missing academy membership for John Doe to fix payment visibility
-- Using the user ID from auth users for the foreign key constraint
INSERT INTO academy_memberships (user_id, academy_id, role, is_active, joined_at)
VALUES (
  'e005ca6c-3029-457b-b26a-b81e262f5f8d',
  '4512f5ed-d766-48e0-8bb1-4ffa1e4a7445',
  'student',
  true,
  now()
) ON CONFLICT (user_id, academy_id) DO NOTHING;