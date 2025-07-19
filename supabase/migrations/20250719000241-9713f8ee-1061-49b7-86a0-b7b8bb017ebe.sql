-- Create classes table for martial arts classes
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES public.profiles(id),
  max_students INTEGER DEFAULT 20,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'all')) DEFAULT 'all',
  age_group TEXT CHECK (age_group IN ('kids', 'teens', 'adults', 'all')) DEFAULT 'all',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create class_schedules table for recurring class times
CREATE TABLE public.class_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create class_enrollments table for student enrollments
CREATE TABLE public.class_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT CHECK (status IN ('active', 'paused', 'dropped')) DEFAULT 'active',
  UNIQUE(class_id, student_id)
);

-- Create attendance table for tracking class attendance
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('present', 'absent', 'excused')) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id, date)
);

-- Enable RLS on all tables
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for classes
CREATE POLICY "Everyone can view active classes" 
ON public.classes 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage all classes" 
ON public.classes 
FOR ALL 
USING (public.get_current_user_role() = 'admin');

-- Create policies for class_schedules
CREATE POLICY "Everyone can view class schedules" 
ON public.class_schedules 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage class schedules" 
ON public.class_schedules 
FOR ALL 
USING (public.get_current_user_role() = 'admin');

-- Create policies for class_enrollments
CREATE POLICY "Students can view their own enrollments" 
ON public.class_enrollments 
FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all enrollments" 
ON public.class_enrollments 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can manage enrollments" 
ON public.class_enrollments 
FOR ALL 
USING (public.get_current_user_role() = 'admin');

-- Create policies for attendance
CREATE POLICY "Students can view their own attendance" 
ON public.attendance 
FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Admins can manage all attendance" 
ON public.attendance 
FOR ALL 
USING (public.get_current_user_role() = 'admin');

-- Add triggers for updated_at columns
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add some sample data
INSERT INTO public.classes (name, description, duration_minutes, skill_level, age_group) VALUES
('Karate Basics', 'Introduction to traditional karate for beginners', 60, 'beginner', 'all'),
('Advanced Sparring', 'Advanced sparring techniques and competition prep', 90, 'advanced', 'teens'),
('Kids Martial Arts', 'Fun martial arts classes designed for children', 45, 'all', 'kids'),
('Adult Self Defense', 'Practical self-defense techniques for adults', 60, 'beginner', 'adults');

-- Add schedules for the sample classes
INSERT INTO public.class_schedules (class_id, day_of_week, start_time, end_time)
SELECT 
  c.id,
  CASE 
    WHEN c.name = 'Karate Basics' THEN 1 -- Monday
    WHEN c.name = 'Advanced Sparring' THEN 3 -- Wednesday  
    WHEN c.name = 'Kids Martial Arts' THEN 2 -- Tuesday
    WHEN c.name = 'Adult Self Defense' THEN 5 -- Friday
  END,
  CASE 
    WHEN c.name = 'Kids Martial Arts' THEN '16:00:00'::TIME
    ELSE '18:00:00'::TIME
  END,
  CASE 
    WHEN c.name = 'Kids Martial Arts' THEN '16:45:00'::TIME
    WHEN c.name = 'Advanced Sparring' THEN '19:30:00'::TIME
    ELSE '19:00:00'::TIME
  END
FROM public.classes c;