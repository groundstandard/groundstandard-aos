-- Create calendar_events table for enhanced calendar functionality
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'class' CHECK (event_type IN ('class', 'event', 'maintenance', 'meeting')),
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly')),
  recurrence_end_date DATE,
  instructor_id UUID REFERENCES public.profiles(id),
  max_participants INTEGER,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed')),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  academy_id UUID REFERENCES public.academies(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policies for calendar_events
CREATE POLICY "Academy members can view calendar events" 
ON public.calendar_events 
FOR SELECT 
USING (
  academy_id IN (
    SELECT am.academy_id 
    FROM academy_memberships am 
    WHERE am.user_id = auth.uid() AND am.is_active = true
  )
);

CREATE POLICY "Admins can manage calendar events" 
ON public.calendar_events 
FOR ALL 
USING (
  get_current_user_role() = ANY(ARRAY['admin', 'owner']) AND
  academy_id IN (
    SELECT am.academy_id 
    FROM academy_memberships am 
    WHERE am.user_id = auth.uid() AND am.is_active = true
  )
);

CREATE POLICY "Instructors can manage their own calendar events" 
ON public.calendar_events 
FOR ALL 
USING (
  instructor_id = auth.uid() OR created_by = auth.uid()
);

-- Add missing columns to check_in_settings
ALTER TABLE public.check_in_settings 
ADD COLUMN IF NOT EXISTS allow_early_checkin_minutes INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS allow_late_checkin_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS require_pin_verification BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_location_tracking BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_distance_meters INTEGER DEFAULT 100;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_date_academy ON public.calendar_events(start_date, academy_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_instructor ON public.calendar_events(instructor_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_calendar_events_updated_at();