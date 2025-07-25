-- Add academy_id column to classes table for proper academy isolation
-- Step 1: Add the academy_id column (nullable initially for safe migration)
ALTER TABLE public.classes 
ADD COLUMN academy_id UUID REFERENCES public.academies(id);

-- Step 2: Create an index for better performance
CREATE INDEX idx_classes_academy_id ON public.classes(academy_id);

-- Step 3: Assign existing classes to academies based on instructor's academy membership
-- This ensures existing classes get properly assigned during migration
UPDATE public.classes 
SET academy_id = (
  SELECT am.academy_id 
  FROM academy_memberships am 
  WHERE am.user_id = classes.instructor_id 
  AND am.is_active = true 
  LIMIT 1
)
WHERE instructor_id IS NOT NULL;

-- Step 4: For classes without instructors, assign to the first available academy
-- (These will need manual review after migration)
UPDATE public.classes 
SET academy_id = (
  SELECT id FROM academies ORDER BY created_at ASC LIMIT 1
)
WHERE academy_id IS NULL;

-- Step 5: Make academy_id NOT NULL after data migration
ALTER TABLE public.classes 
ALTER COLUMN academy_id SET NOT NULL;

-- Step 6: Update RLS policies to include academy isolation
DROP POLICY IF EXISTS "Everyone can view active classes" ON public.classes;
DROP POLICY IF EXISTS "Admins and owners can manage all classes" ON public.classes;

-- New academy-isolated RLS policies
CREATE POLICY "Academy members can view academy classes" 
ON public.classes 
FOR SELECT 
USING (
  is_active = true 
  AND academy_id IN (
    SELECT am.academy_id 
    FROM academy_memberships am 
    WHERE am.user_id = auth.uid() 
    AND am.is_active = true
  )
);

CREATE POLICY "Academy admins can manage academy classes" 
ON public.classes 
FOR ALL 
USING (
  academy_id IN (
    SELECT am.academy_id 
    FROM academy_memberships am 
    WHERE am.user_id = auth.uid() 
    AND am.is_active = true 
    AND am.role IN ('admin', 'owner')
  )
);

-- Step 7: Add trigger to automatically set academy_id for new classes
CREATE OR REPLACE FUNCTION public.set_class_academy_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set academy_id based on the creating user's active academy membership
  IF NEW.academy_id IS NULL THEN
    SELECT am.academy_id INTO NEW.academy_id
    FROM academy_memberships am
    WHERE am.user_id = auth.uid() 
    AND am.is_active = true
    AND am.role IN ('admin', 'owner')
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_class_academy_id_trigger
  BEFORE INSERT ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_class_academy_id();