-- Add academy isolation to attendance table
ALTER TABLE attendance ADD COLUMN academy_id UUID REFERENCES academies(id);

-- Create index for better performance
CREATE INDEX idx_attendance_academy_id ON attendance(academy_id);

-- Update existing attendance records to set academy_id based on student's academy
UPDATE attendance 
SET academy_id = (
  SELECT am.academy_id 
  FROM academy_memberships am 
  WHERE am.user_id = attendance.student_id 
  AND am.is_active = true 
  LIMIT 1
);

-- Create function to automatically set academy_id on attendance insert
CREATE OR REPLACE FUNCTION set_attendance_academy_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Set academy_id based on student's active academy membership
  SELECT am.academy_id INTO NEW.academy_id
  FROM academy_memberships am
  WHERE am.user_id = NEW.student_id 
  AND am.is_active = true
  LIMIT 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set academy_id automatically
CREATE TRIGGER trigger_set_attendance_academy_id
  BEFORE INSERT ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION set_attendance_academy_id();

-- Add attendance notification settings table
CREATE TABLE attendance_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID REFERENCES academies(id) NOT NULL,
  notify_absences BOOLEAN DEFAULT true,
  notify_late_arrivals BOOLEAN DEFAULT true,
  consecutive_absence_threshold INTEGER DEFAULT 3,
  notification_methods TEXT[] DEFAULT '{"email"}',
  parent_notification_enabled BOOLEAN DEFAULT true,
  instructor_notification_enabled BOOLEAN DEFAULT true,
  admin_notification_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on attendance_notifications
ALTER TABLE attendance_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for attendance_notifications
CREATE POLICY "Academy members can manage their notification settings"
ON attendance_notifications
FOR ALL
USING (
  academy_id IN (
    SELECT am.academy_id 
    FROM academy_memberships am 
    WHERE am.user_id = auth.uid() 
    AND am.is_active = true
  )
);

-- Create attendance streaks tracking table
CREATE TABLE attendance_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) NOT NULL,
  class_id UUID REFERENCES classes(id) NOT NULL,
  streak_type TEXT NOT NULL CHECK (streak_type IN ('present', 'absent')),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_updated_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, class_id, streak_type)
);

-- Enable RLS on attendance_streaks
ALTER TABLE attendance_streaks ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for attendance_streaks
CREATE POLICY "Academy members can view attendance streaks"
ON attendance_streaks
FOR ALL
USING (
  EXISTS (
    SELECT 1 
    FROM academy_memberships am1
    JOIN academy_memberships am2 ON am1.academy_id = am2.academy_id
    WHERE am1.user_id = auth.uid() 
    AND am2.user_id = attendance_streaks.student_id
    AND am1.is_active = true 
    AND am2.is_active = true
  )
);

-- Function to update attendance streaks
CREATE OR REPLACE FUNCTION update_attendance_streaks()
RETURNS TRIGGER AS $$
BEGIN
  -- Update present streak
  INSERT INTO attendance_streaks (student_id, class_id, streak_type, current_streak, longest_streak, last_updated_date)
  VALUES (NEW.student_id, NEW.class_id, 'present', 
    CASE WHEN NEW.status = 'present' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'present' THEN 1 ELSE 0 END,
    NEW.date::date)
  ON CONFLICT (student_id, class_id, streak_type)
  DO UPDATE SET
    current_streak = CASE 
      WHEN NEW.status = 'present' AND attendance_streaks.last_updated_date = NEW.date::date - INTERVAL '1 day' 
      THEN attendance_streaks.current_streak + 1
      WHEN NEW.status = 'present' THEN 1
      ELSE 0
    END,
    longest_streak = GREATEST(attendance_streaks.longest_streak, 
      CASE 
        WHEN NEW.status = 'present' AND attendance_streaks.last_updated_date = NEW.date::date - INTERVAL '1 day' 
        THEN attendance_streaks.current_streak + 1
        WHEN NEW.status = 'present' THEN 1
        ELSE attendance_streaks.longest_streak
      END),
    last_updated_date = NEW.date::date,
    updated_at = now();

  -- Update absent streak
  INSERT INTO attendance_streaks (student_id, class_id, streak_type, current_streak, longest_streak, last_updated_date)
  VALUES (NEW.student_id, NEW.class_id, 'absent', 
    CASE WHEN NEW.status = 'absent' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'absent' THEN 1 ELSE 0 END,
    NEW.date::date)
  ON CONFLICT (student_id, class_id, streak_type)
  DO UPDATE SET
    current_streak = CASE 
      WHEN NEW.status = 'absent' AND attendance_streaks.last_updated_date = NEW.date::date - INTERVAL '1 day' 
      THEN attendance_streaks.current_streak + 1
      WHEN NEW.status = 'absent' THEN 1
      ELSE 0
    END,
    longest_streak = GREATEST(attendance_streaks.longest_streak, 
      CASE 
        WHEN NEW.status = 'absent' AND attendance_streaks.last_updated_date = NEW.date::date - INTERVAL '1 day' 
        THEN attendance_streaks.current_streak + 1
        WHEN NEW.status = 'absent' THEN 1
        ELSE attendance_streaks.longest_streak
      END),
    last_updated_date = NEW.date::date,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for attendance streaks
CREATE TRIGGER trigger_update_attendance_streaks
  AFTER INSERT OR UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_streaks();