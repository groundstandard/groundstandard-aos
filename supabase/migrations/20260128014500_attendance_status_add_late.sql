-- Allow 'late' as an attendance status
-- Existing schema constraint only allows ('present', 'absent', 'excused')

ALTER TABLE public.attendance
DROP CONSTRAINT IF EXISTS attendance_status_check;

ALTER TABLE public.attendance
ADD CONSTRAINT attendance_status_check
CHECK (status IN ('present', 'absent', 'late', 'excused'));
