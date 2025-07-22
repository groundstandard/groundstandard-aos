-- First, make academy_id nullable and add a temporary academy for testing
DO $$
DECLARE
    temp_academy_id UUID;
BEGIN
    -- Make academy_id nullable if it's not already
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'academy_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.profiles ALTER COLUMN academy_id DROP NOT NULL;
    END IF;
    
    -- Create a temporary academy for testing if it doesn't exist
    INSERT INTO public.academies (id, name, owner_id, is_setup_complete)
    VALUES (
        '00000000-1111-1111-1111-000000000000',
        'Demo Academy',
        '00000000-0000-0000-0000-000000000001',
        true
    ) ON CONFLICT (id) DO NOTHING;
END $$;

-- Now insert the 100 mock contacts with the academy_id
INSERT INTO public.profiles (
  id, email, first_name, last_name, role, phone, emergency_contact_name, emergency_contact_phone,
  belt_level, membership_status, date_of_birth, address, city, state, zipcode, notes, student_id,
  check_in_pin, academy_id
) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'john.smith@email.com', 'John', 'Smith', 'student', '(555) 123-4567', 'Jane Smith', '(555) 123-4568', 'White', 'active', '1985-03-15', '123 Main St', 'Austin', 'TX', '78701', 'Very dedicated student', 'STU001', '1234', '00000000-1111-1111-1111-000000000000'),
  ('00000000-0000-0000-0000-000000000002', 'sarah.johnson@email.com', 'Sarah', 'Johnson', 'instructor', '(555) 234-5678', 'Mike Johnson', '(555) 234-5679', 'Black', 'active', '1982-07-22', '456 Oak Ave', 'Austin', 'TX', '78702', 'Senior instructor', 'INS001', '2345', '00000000-1111-1111-1111-000000000000'),
  ('00000000-0000-0000-0000-000000000003', 'mike.wilson@email.com', 'Mike', 'Wilson', 'student', '(555) 345-6789', 'Lisa Wilson', '(555) 345-6790', 'Yellow', 'active', '1990-11-08', '789 Pine St', 'Austin', 'TX', '78703', 'Good attendance record', 'STU002', '3456', '00000000-1111-1111-1111-000000000000'),
  ('00000000-0000-0000-0000-000000000004', 'emma.davis@email.com', 'Emma', 'Davis', 'student', '(555) 456-7890', 'Robert Davis', '(555) 456-7891', 'Orange', 'inactive', '1995-05-12', '321 Elm Dr', 'Austin', 'TX', '78704', 'On temporary leave', 'STU003', '4567', '00000000-1111-1111-1111-000000000000'),
  ('00000000-0000-0000-0000-000000000005', 'james.brown@email.com', 'James', 'Brown', 'admin', '(555) 567-8901', 'Mary Brown', '(555) 567-8902', 'Black', 'active', '1978-09-30', '654 Maple Ln', 'Austin', 'TX', '78705', 'Academy administrator', 'ADM001', '5678', '00000000-1111-1111-1111-000000000000'),
  ('00000000-0000-0000-0000-000000000006', 'olivia.jones@email.com', 'Olivia', 'Jones', 'student', '(555) 678-9012', 'David Jones', '(555) 678-9013', 'Green', 'active', '1988-12-25', '987 Cedar St', 'Austin', 'TX', '78706', 'Competes regularly', 'STU004', '6789', '00000000-1111-1111-1111-000000000000'),
  ('00000000-0000-0000-0000-000000000007', 'william.garcia@email.com', 'William', 'Garcia', 'student', '(555) 789-0123', 'Maria Garcia', '(555) 789-0124', 'Blue', 'active', '1992-02-14', '147 Birch Rd', 'Austin', 'TX', '78707', 'Team captain', 'STU005', '7890', '00000000-1111-1111-1111-000000000000'),
  ('00000000-0000-0000-0000-000000000008', 'ava.martinez@email.com', 'Ava', 'Martinez', 'student', '(555) 890-1234', 'Carlos Martinez', '(555) 890-1235', 'Purple', 'active', '1987-06-18', '258 Willow Way', 'Austin', 'TX', '78708', 'Excellent technique', 'STU006', '8901', '00000000-1111-1111-1111-000000000000'),
  ('00000000-0000-0000-0000-000000000009', 'noah.rodriguez@email.com', 'Noah', 'Rodriguez', 'student', '(555) 901-2345', 'Ana Rodriguez', '(555) 901-2346', 'Brown', 'alumni', '1983-10-05', '369 Spruce Ave', 'Austin', 'TX', '78709', 'Former champion', 'STU007', '9012', '00000000-1111-1111-1111-000000000000'),
  ('00000000-0000-0000-0000-000000000010', 'sophia.lopez@email.com', 'Sophia', 'Lopez', 'instructor', '(555) 012-3456', 'Juan Lopez', '(555) 012-3457', 'Black', 'active', '1980-04-20', '741 Ash St', 'Austin', 'TX', '78710', 'Kids program leader', 'INS002', '0123', '00000000-1111-1111-1111-000000000000');

-- Continue with 90 more contacts using generate_series
INSERT INTO public.profiles (
  id, email, first_name, last_name, role, phone, emergency_contact_name, emergency_contact_phone,
  belt_level, membership_status, date_of_birth, address, city, state, zipcode, notes, student_id,
  check_in_pin, academy_id
) SELECT 
  ('00000000-0000-0000-0000-' || LPAD((10 + generate_series)::text, 12, '0'))::uuid,
  CASE 
    WHEN generate_series % 7 = 0 THEN 'student' || (10 + generate_series) || '@email.com'
    WHEN generate_series % 7 = 1 THEN 'member' || (10 + generate_series) || '@email.com'  
    WHEN generate_series % 7 = 2 THEN 'athlete' || (10 + generate_series) || '@email.com'
    WHEN generate_series % 7 = 3 THEN 'trainee' || (10 + generate_series) || '@email.com'
    WHEN generate_series % 7 = 4 THEN 'fighter' || (10 + generate_series) || '@email.com'
    WHEN generate_series % 7 = 5 THEN 'champion' || (10 + generate_series) || '@email.com'
    ELSE 'contact' || (10 + generate_series) || '@email.com'
  END,
  CASE 
    WHEN generate_series % 20 = 0 THEN 'Alex'
    WHEN generate_series % 20 = 1 THEN 'Taylor'
    WHEN generate_series % 20 = 2 THEN 'Jordan'
    WHEN generate_series % 20 = 3 THEN 'Casey'
    WHEN generate_series % 20 = 4 THEN 'Morgan'
    WHEN generate_series % 20 = 5 THEN 'Riley'
    WHEN generate_series % 20 = 6 THEN 'Avery'
    WHEN generate_series % 20 = 7 THEN 'Quinn'
    WHEN generate_series % 20 = 8 THEN 'Cameron'
    WHEN generate_series % 20 = 9 THEN 'Blake'
    WHEN generate_series % 20 = 10 THEN 'Sage'
    WHEN generate_series % 20 = 11 THEN 'Drew'
    WHEN generate_series % 20 = 12 THEN 'Peyton'
    WHEN generate_series % 20 = 13 THEN 'Reese'
    WHEN generate_series % 20 = 14 THEN 'Dakota'
    WHEN generate_series % 20 = 15 THEN 'Skyler'
    WHEN generate_series % 20 = 16 THEN 'River'
    WHEN generate_series % 20 = 17 THEN 'Phoenix'
    WHEN generate_series % 20 = 18 THEN 'Rowan'
    ELSE 'Jamie'
  END,
  CASE 
    WHEN generate_series % 15 = 0 THEN 'Anderson'
    WHEN generate_series % 15 = 1 THEN 'Thompson'
    WHEN generate_series % 15 = 2 THEN 'Williams'
    WHEN generate_series % 15 = 3 THEN 'Johnson'
    WHEN generate_series % 15 = 4 THEN 'Jackson'
    WHEN generate_series % 15 = 5 THEN 'Harrison'
    WHEN generate_series % 15 = 6 THEN 'Peterson'
    WHEN generate_series % 15 = 7 THEN 'Robinson'
    WHEN generate_series % 15 = 8 THEN 'Campbell'
    WHEN generate_series % 15 = 9 THEN 'Mitchell'
    WHEN generate_series % 15 = 10 THEN 'Roberts'
    WHEN generate_series % 15 = 11 THEN 'Turner'
    WHEN generate_series % 15 = 12 THEN 'Phillips'
    WHEN generate_series % 15 = 13 THEN 'Stewart'
    ELSE 'Clark'
  END,
  CASE 
    WHEN generate_series % 15 = 0 THEN 'instructor'
    WHEN generate_series % 15 IN (1,2) THEN 'admin'
    ELSE 'student'
  END,
  '(555) ' || LPAD(((100 + generate_series) % 900 + 100)::text, 3, '0') || '-' || LPAD(((1000 + generate_series * 7) % 9000 + 1000)::text, 4, '0'),
  'Emergency Contact ' || (10 + generate_series),
  '(555) ' || LPAD(((200 + generate_series) % 900 + 100)::text, 3, '0') || '-' || LPAD(((2000 + generate_series * 7) % 9000 + 1000)::text, 4, '0'),
  CASE 
    WHEN generate_series % 8 = 0 THEN 'White'
    WHEN generate_series % 8 = 1 THEN 'Yellow'
    WHEN generate_series % 8 = 2 THEN 'Orange'
    WHEN generate_series % 8 = 3 THEN 'Green'
    WHEN generate_series % 8 = 4 THEN 'Blue'
    WHEN generate_series % 8 = 5 THEN 'Purple'
    WHEN generate_series % 8 = 6 THEN 'Brown'
    ELSE 'Black'
  END,
  CASE 
    WHEN generate_series % 5 = 0 THEN 'inactive'
    WHEN generate_series % 25 = 0 THEN 'alumni'
    ELSE 'active'
  END,
  ('1975-01-01'::date + (generate_series * 127 + 1000) % 15000),
  (100 + generate_series) || ' Street Name ' || (generate_series % 10 + 1),
  'Austin',
  'TX',
  ('787' || LPAD(((10 + generate_series) % 90)::text, 2, '0')),
  'Auto-generated contact ' || (10 + generate_series),
  'STU' || LPAD((10 + generate_series)::text, 3, '0'),
  LPAD(((1000 + generate_series * 13) % 9000 + 1000)::text, 4, '0'),
  '00000000-1111-1111-1111-000000000000'
FROM generate_series(1, 90);

-- Add some family relationships
INSERT INTO public.family_relationships (primary_contact_id, related_contact_id, relationship_type, is_emergency_contact) VALUES 
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'child', true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000012', 'child', true),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000013', 'child', true),
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000014', 'child', true),
  ('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000015', 'spouse', false);