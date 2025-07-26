-- Add missing academy membership for John Doe to fix payment visibility
INSERT INTO academy_memberships (user_id, academy_id, role, is_active, joined_at)
SELECT 
  p.id,
  p.academy_id,
  CASE 
    WHEN p.role = 'member' THEN 'student'
    ELSE p.role
  END,
  true,
  p.created_at
FROM profiles p
WHERE p.academy_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM academy_memberships am 
    WHERE am.user_id = p.id AND am.academy_id = p.academy_id
  );