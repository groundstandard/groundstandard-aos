-- Create 100 mock contacts with diverse types and family relationships
INSERT INTO public.profiles (
  id,
  email,
  first_name,
  last_name,
  phone,
  role,
  belt_level,
  membership_status,
  date_of_birth,
  emergency_contact_name,
  emergency_contact_phone,
  medical_conditions,
  notes,
  academy_id,
  address,
  city,
  state,
  zipcode,
  gender,
  check_in_pin
) VALUES 
-- Family 1: The Johnson Family
('f1000001-0000-0000-0000-000000000001', 'mike.johnson@email.com', 'Mike', 'Johnson', '555-0101', 'parent', NULL, 'active', '1985-03-15', 'Sarah Johnson', '555-0102', NULL, 'Parent account', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '123 Oak Street', 'New York', 'NY', '10001', 'male', '1001'),
('f1000001-0000-0000-0000-000000000002', 'sarah.johnson@email.com', 'Sarah', 'Johnson', '555-0102', 'parent', NULL, 'active', '1987-07-22', 'Mike Johnson', '555-0101', NULL, 'Parent account', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '123 Oak Street', 'New York', 'NY', '10001', 'female', '1002'),
('f1000001-0000-0000-0000-000000000003', 'emma.johnson@email.com', 'Emma', 'Johnson', '555-0103', 'student', 'white', 'active', '2010-05-12', 'Mike Johnson', '555-0101', 'Allergic to peanuts', 'Enthusiastic beginner', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '123 Oak Street', 'New York', 'NY', '10001', 'female', '1003'),
('f1000001-0000-0000-0000-000000000004', 'lucas.johnson@email.com', 'Lucas', 'Johnson', '555-0104', 'student', 'yellow', 'active', '2012-09-08', 'Mike Johnson', '555-0101', NULL, 'Great form and technique', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '123 Oak Street', 'New York', 'NY', '10001', 'male', '1004'),

-- Family 2: The Rodriguez Family
('f2000001-0000-0000-0000-000000000001', 'carlos.rodriguez@email.com', 'Carlos', 'Rodriguez', '555-0201', 'parent', 'black_1st_dan', 'active', '1980-11-30', 'Maria Rodriguez', '555-0202', NULL, 'Former competitor, now parent', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '456 Pine Avenue', 'New York', 'NY', '10002', 'male', '2001'),
('f2000001-0000-0000-0000-000000000002', 'maria.rodriguez@email.com', 'Maria', 'Rodriguez', '555-0202', 'parent', NULL, 'active', '1982-04-18', 'Carlos Rodriguez', '555-0201', 'Diabetes Type 2', 'Very supportive parent', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '456 Pine Avenue', 'New York', 'NY', '10002', 'female', '2002'),
('f2000001-0000-0000-0000-000000000003', 'sofia.rodriguez@email.com', 'Sofia', 'Rodriguez', '555-0203', 'student', 'green', 'active', '2009-12-25', 'Carlos Rodriguez', '555-0201', NULL, 'Natural talent, very focused', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '456 Pine Avenue', 'New York', 'NY', '10002', 'female', '2003'),

-- Family 3: The Chen Family  
('f3000001-0000-0000-0000-000000000001', 'david.chen@email.com', 'David', 'Chen', '555-0301', 'parent', NULL, 'active', '1978-06-14', 'Lisa Chen', '555-0302', NULL, 'Works in tech', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '789 Maple Drive', 'New York', 'NY', '10003', 'male', '3001'),
('f3000001-0000-0000-0000-000000000002', 'lisa.chen@email.com', 'Lisa', 'Chen', '555-0302', 'parent', NULL, 'active', '1981-01-28', 'David Chen', '555-0301', NULL, 'Doctor at local hospital', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '789 Maple Drive', 'New York', 'NY', '10003', 'female', '3002'),
('f3000001-0000-0000-0000-000000000003', 'kevin.chen@email.com', 'Kevin', 'Chen', '555-0303', 'student', 'blue', 'active', '2011-03-17', 'David Chen', '555-0301', 'Asthma', 'Very disciplined student', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '789 Maple Drive', 'New York', 'NY', '10003', 'male', '3003'),
('f3000001-0000-0000-0000-000000000004', 'amy.chen@email.com', 'Amy', 'Chen', '555-0304', 'student', 'orange', 'active', '2013-08-22', 'David Chen', '555-0301', NULL, 'Quick learner, loves competitions', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '789 Maple Drive', 'New York', 'NY', '10003', 'female', '3004'),

-- Individual Students (Adult)
('i1000001-0000-0000-0000-000000000001', 'james.wilson@email.com', 'James', 'Wilson', '555-0401', 'student', 'brown', 'active', '1995-02-14', 'Emily Wilson', '555-0402', NULL, 'College student, part-time', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '321 Cedar Lane', 'New York', 'NY', '10004', 'male', '4001'),
('i1000001-0000-0000-0000-000000000002', 'ashley.davis@email.com', 'Ashley', 'Davis', '555-0501', 'student', 'purple', 'active', '1992-09-03', 'Michael Davis', '555-0502', 'Previous knee injury', 'Returning after break', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '654 Birch Road', 'New York', 'NY', '10005', 'female', '5001'),
('i1000001-0000-0000-0000-000000000003', 'michael.thompson@email.com', 'Michael', 'Thompson', '555-0601', 'student', 'red', 'active', '1988-12-11', 'Jennifer Thompson', '555-0602', NULL, 'Training for black belt test', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '987 Elm Street', 'New York', 'NY', '10006', 'male', '6001'),
('i1000001-0000-0000-0000-000000000004', 'jessica.martinez@email.com', 'Jessica', 'Martinez', '555-0701', 'student', 'black_1st_dan', 'active', '1990-05-19', 'Roberto Martinez', '555-0702', NULL, 'Recently promoted to black belt', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '147 Willow Way', 'New York', 'NY', '10007', 'female', '7001'),
('i1000001-0000-0000-0000-000000000005', 'robert.taylor@email.com', 'Robert', 'Taylor', '555-0801', 'student', 'black_2nd_dan', 'active', '1985-08-07', 'Linda Taylor', '555-0802', NULL, 'Assistant instructor in training', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '258 Poplar Place', 'New York', 'NY', '10008', 'male', '8001'),

-- Instructors and Staff
('s1000001-0000-0000-0000-000000000001', 'sensei.kim@email.com', 'Master', 'Kim', '555-0901', 'instructor', 'black_5th_dan', 'active', '1975-01-15', 'Susan Kim', '555-0902', NULL, 'Head instructor with 25 years experience', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '369 Harmony Drive', 'New York', 'NY', '10009', 'male', '9001'),
('s1000001-0000-0000-0000-000000000002', 'instructor.brown@email.com', 'Sarah', 'Brown', '555-1001', 'instructor', 'black_3rd_dan', 'active', '1986-06-22', 'Mark Brown', '555-1002', NULL, 'Specializes in youth programs', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '741 Peace Street', 'New York', 'NY', '10010', 'female', '1001'),
('s1000001-0000-0000-0000-000000000003', 'assistant.lee@email.com', 'Daniel', 'Lee', '555-1101', 'instructor', 'black_2nd_dan', 'active', '1991-11-08', 'Grace Lee', '555-1102', NULL, 'Competition team coach', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '852 Victory Lane', 'New York', 'NY', '10011', 'male', '1101'),

-- Prospects and Trial Members
('p1000001-0000-0000-0000-000000000001', 'prospect.smith@email.com', 'John', 'Smith', '555-1201', 'prospect', NULL, 'trial', '1994-04-12', 'Jane Smith', '555-1202', NULL, 'Interested in starting martial arts', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '963 Trial Avenue', 'New York', 'NY', '10012', 'male', '1201'),
('p1000001-0000-0000-0000-000000000002', 'trial.williams@email.com', 'Emma', 'Williams', '555-1301', 'prospect', NULL, 'trial', '2008-07-30', 'Tom Williams', '555-1302', 'Mild anxiety', 'Shy but interested in training', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '159 Explorer Road', 'New York', 'NY', '10013', 'female', '1301'),

-- Inactive/Former Members
('f1000001-0000-0000-0000-000000000005', 'former.garcia@email.com', 'Alex', 'Garcia', '555-1401', 'student', 'green', 'inactive', '1993-10-25', 'Rosa Garcia', '555-1402', NULL, 'Moved away, may return', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '357 Former Lane', 'New York', 'NY', '10014', 'male', '1401'),
('f1000001-0000-0000-0000-000000000006', 'paused.jones@email.com', 'Megan', 'Jones', '555-1501', 'student', 'blue', 'paused', '1996-02-18', 'Steve Jones', '555-1502', 'Recovering from surgery', 'Medical leave, plans to return', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '468 Pause Street', 'New York', 'NY', '10015', 'female', '1501'),

-- More diverse individual students and families
('d1000001-0000-0000-0000-000000000001', 'teen.cooper@email.com', 'Tyler', 'Cooper', '555-1601', 'student', 'orange', 'active', '2007-05-10', 'Rachel Cooper', '555-1602', NULL, 'Teenager, very motivated', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '579 Youth Drive', 'New York', 'NY', '10016', 'male', '1601'),
('d1000001-0000-0000-0000-000000000002', 'adult.morgan@email.com', 'Patricia', 'Morgan', '555-1701', 'student', 'white', 'active', '1972-12-03', 'William Morgan', '555-1702', 'Arthritis in hands', 'Senior student, loves the mental aspects', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '681 Senior Circle', 'New York', 'NY', '10017', 'female', '1701'),

-- Family 4: The Patel Family
('f4000001-0000-0000-0000-000000000001', 'raj.patel@email.com', 'Raj', 'Patel', '555-1801', 'parent', NULL, 'active', '1983-03-28', 'Priya Patel', '555-1802', NULL, 'Engineer, very analytical', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '792 Tech Boulevard', 'New York', 'NY', '10018', 'male', '1801'),
('f4000001-0000-0000-0000-000000000002', 'priya.patel@email.com', 'Priya', 'Patel', '555-1802', 'parent', NULL, 'active', '1985-08-15', 'Raj Patel', '555-1801', NULL, 'Teacher, values discipline', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '792 Tech Boulevard', 'New York', 'NY', '10018', 'female', '1802'),
('f4000001-0000-0000-0000-000000000003', 'arjun.patel@email.com', 'Arjun', 'Patel', '555-1803', 'student', 'yellow', 'active', '2010-11-12', 'Raj Patel', '555-1801', NULL, 'Good at memorizing forms', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '792 Tech Boulevard', 'New York', 'NY', '10018', 'male', '1803'),
('f4000001-0000-0000-0000-000000000004', 'maya.patel@email.com', 'Maya', 'Patel', '555-1804', 'student', 'white', 'active', '2014-02-07', 'Raj Patel', '555-1801', NULL, 'Just started, very excited', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '792 Tech Boulevard', 'New York', 'NY', '10018', 'female', '1804'),

-- Continue with more diverse contacts...
('d2000001-0000-0000-0000-000000000001', 'athlete.jackson@email.com', 'Marcus', 'Jackson', '555-1901', 'student', 'red', 'active', '1989-07-04', 'Denise Jackson', '555-1902', NULL, 'Former football player', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '135 Athlete Ave', 'New York', 'NY', '10019', 'male', '1901'),
('d2000001-0000-0000-0000-000000000002', 'fitness.white@email.com', 'Amanda', 'White', '555-2001', 'student', 'purple', 'active', '1987-01-20', 'Brian White', '555-2002', NULL, 'Fitness instructor, loves martial arts', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '246 Fitness Street', 'New York', 'NY', '10020', 'female', '2001'),
('d2000001-0000-0000-0000-000000000003', 'business.adams@email.com', 'Richard', 'Adams', '555-2101', 'student', 'brown', 'active', '1979-09-16', 'Susan Adams', '555-2102', 'High blood pressure', 'Business owner, stress relief', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '357 Business Blvd', 'New York', 'NY', '10021', 'male', '2101'),

-- Family 5: The O'Brien Family
('f5000001-0000-0000-0000-000000000001', 'sean.obrien@email.com', 'Sean', 'O''Brien', '555-2201', 'parent', 'black_1st_dan', 'active', '1981-05-09', 'Katie O''Brien', '555-2202', NULL, 'Police officer, former competitor', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '468 Irish Lane', 'New York', 'NY', '10022', 'male', '2201'),
('f5000001-0000-0000-0000-000000000002', 'katie.obrien@email.com', 'Katie', 'O''Brien', '555-2202', 'parent', NULL, 'active', '1984-12-22', 'Sean O''Brien', '555-2201', NULL, 'Nurse, very caring', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '468 Irish Lane', 'New York', 'NY', '10022', 'female', '2202'),
('f5000001-0000-0000-0000-000000000003', 'liam.obrien@email.com', 'Liam', 'O''Brien', '555-2203', 'student', 'green', 'active', '2009-08-14', 'Sean O''Brien', '555-2201', NULL, 'Following in dad''s footsteps', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '468 Irish Lane', 'New York', 'NY', '10022', 'male', '2203'),
('f5000001-0000-0000-0000-000000000004', 'chloe.obrien@email.com', 'Chloe', 'O''Brien', '555-2204', 'student', 'yellow', 'active', '2012-04-03', 'Sean O''Brien', '555-2201', NULL, 'Natural athlete like her father', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '468 Irish Lane', 'New York', 'NY', '10022', 'female', '2204'),

-- More individual students with various backgrounds
('d3000001-0000-0000-0000-000000000001', 'veteran.harris@email.com', 'James', 'Harris', '555-2301', 'student', 'blue', 'active', '1976-11-30', 'Mary Harris', '555-2302', 'PTSD', 'Military veteran using martial arts for therapy', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '579 Veteran Way', 'New York', 'NY', '10023', 'male', '2301'),
('d3000001-0000-0000-0000-000000000002', 'artist.lopez@email.com', 'Isabella', 'Lopez', '555-2401', 'student', 'orange', 'active', '1991-06-25', 'Carlos Lopez', '555-2402', NULL, 'Artist, loves the flowing movements', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '681 Creative Court', 'New York', 'NY', '10024', 'female', '2401'),
('d3000001-0000-0000-0000-000000000003', 'doctor.kumar@email.com', 'Vikram', 'Kumar', '555-2501', 'student', 'purple', 'active', '1984-02-18', 'Anjali Kumar', '555-2502', NULL, 'Surgeon, precise and methodical', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '792 Medical Plaza', 'New York', 'NY', '10025', 'male', '2501'),

-- Family 6: The Anderson Family
('f6000001-0000-0000-0000-000000000001', 'mark.anderson@email.com', 'Mark', 'Anderson', '555-2601', 'parent', NULL, 'active', '1977-09-12', 'Jennifer Anderson', '555-2602', NULL, 'Construction worker, values discipline', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '135 Builder Road', 'New York', 'NY', '10026', 'male', '2601'),
('f6000001-0000-0000-0000-000000000002', 'jennifer.anderson@email.com', 'Jennifer', 'Anderson', '555-2602', 'parent', NULL, 'active', '1980-03-07', 'Mark Anderson', '555-2601', NULL, 'Accountant, organized and detail-oriented', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '135 Builder Road', 'New York', 'NY', '10026', 'female', '2602'),
('f6000001-0000-0000-0000-000000000003', 'ethan.anderson@email.com', 'Ethan', 'Anderson', '555-2603', 'student', 'blue', 'active', '2008-10-20', 'Mark Anderson', '555-2601', NULL, 'Strong and determined', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '135 Builder Road', 'New York', 'NY', '10026', 'male', '2603'),
('f6000001-0000-0000-0000-000000000004', 'olivia.anderson@email.com', 'Olivia', 'Anderson', '555-2604', 'student', 'orange', 'active', '2011-01-15', 'Mark Anderson', '555-2601', 'Mild scoliosis', 'Working on posture through martial arts', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '135 Builder Road', 'New York', 'NY', '10026', 'female', '2604'),

-- More prospects and trial members
('p2000001-0000-0000-0000-000000000001', 'curious.wright@email.com', 'Nancy', 'Wright', '555-2701', 'prospect', NULL, 'trial', '1995-08-11', 'Tom Wright', '555-2702', NULL, 'Curious about self-defense', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '246 Curious Lane', 'New York', 'NY', '10027', 'female', '2701'),
('p2000001-0000-0000-0000-000000000002', 'hesitant.clark@email.com', 'George', 'Clark', '555-2801', 'prospect', NULL, 'trial', '1986-12-04', 'Helen Clark', '555-2802', 'Previous back injury', 'Nervous but interested', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '357 Hesitant Street', 'New York', 'NY', '10028', 'male', '2801'),

-- Additional instructors and senior students
('s2000001-0000-0000-0000-000000000001', 'senior.mitchell@email.com', 'Paul', 'Mitchell', '555-2901', 'instructor', 'black_4th_dan', 'active', '1970-04-27', 'Linda Mitchell', '555-2902', NULL, 'Senior instructor, tournament judge', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '468 Senior Dojo Lane', 'New York', 'NY', '10029', 'male', '2901'),
('s2000001-0000-0000-0000-000000000002', 'blackbelt.turner@email.com', 'Lisa', 'Turner', '555-3001', 'student', 'black_3rd_dan', 'active', '1988-07-16', 'Robert Turner', '555-3002', NULL, 'High-ranking student, helps with instruction', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '579 Excellence Drive', 'New York', 'NY', '10030', 'female', '3001'),

-- Family 7: The Walker Family
('f7000001-0000-0000-0000-000000000001', 'thomas.walker@email.com', 'Thomas', 'Walker', '555-3101', 'parent', NULL, 'active', '1974-02-14', 'Diana Walker', '555-3102', NULL, 'Retired military, values discipline', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '681 Military Court', 'New York', 'NY', '10031', 'male', '3101'),
('f7000001-0000-0000-0000-000000000002', 'diana.walker@email.com', 'Diana', 'Walker', '555-3102', 'parent', NULL, 'active', '1976-09-22', 'Thomas Walker', '555-3101', NULL, 'School principal, loves martial arts values', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '681 Military Court', 'New York', 'NY', '10031', 'female', '3102'),
('f7000001-0000-0000-0000-000000000003', 'alexander.walker@email.com', 'Alexander', 'Walker', '555-3103', 'student', 'red', 'active', '2007-06-18', 'Thomas Walker', '555-3101', NULL, 'Dedicated and disciplined like his father', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '681 Military Court', 'New York', 'NY', '10031', 'male', '3103'),
('f7000001-0000-0000-0000-000000000004', 'samantha.walker@email.com', 'Samantha', 'Walker', '555-3104', 'student', 'purple', 'active', '2009-12-30', 'Thomas Walker', '555-3101', NULL, 'Strong competitor, tournament medalist', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '681 Military Court', 'New York', 'NY', '10031', 'female', '3104'),

-- More diverse individual students
('d4000001-0000-0000-0000-000000000001', 'college.green@email.com', 'Brandon', 'Green', '555-3201', 'student', 'brown', 'active', '2000-03-25', 'Carol Green', '555-3202', NULL, 'College student, trains during breaks', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '792 Campus Avenue', 'New York', 'NY', '10032', 'male', '3201'),
('d4000001-0000-0000-0000-000000000002', 'working.mom@email.com', 'Rachel', 'Phillips', '555-3301', 'student', 'yellow', 'active', '1989-11-08', 'David Phillips', '555-3302', NULL, 'Working mom, trains for stress relief', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '135 Working Parent Way', 'New York', 'NY', '10033', 'female', '3301'),
('d4000001-0000-0000-0000-000000000003', 'retiree.king@email.com', 'William', 'King', '555-3401', 'student', 'white', 'active', '1945-05-12', 'Margaret King', '555-3402', 'Heart condition (mild)', 'Retired, started martial arts for fitness', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '246 Golden Years Road', 'New York', 'NY', '10034', 'male', '3401'),

-- Family 8: The Murphy Family
('f8000001-0000-0000-0000-000000000001', 'patrick.murphy@email.com', 'Patrick', 'Murphy', '555-3501', 'parent', NULL, 'active', '1982-08-19', 'Colleen Murphy', '555-3502', NULL, 'Firefighter, values courage and discipline', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '357 Hero Street', 'New York', 'NY', '10035', 'male', '3501'),
('f8000001-0000-0000-0000-000000000002', 'colleen.murphy@email.com', 'Colleen', 'Murphy', '555-3502', 'parent', NULL, 'active', '1985-01-26', 'Patrick Murphy', '555-3501', NULL, 'Social worker, believes in martial arts benefits', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '357 Hero Street', 'New York', 'NY', '10035', 'female', '3502'),
('f8000001-0000-0000-0000-000000000003', 'connor.murphy@email.com', 'Connor', 'Murphy', '555-3503', 'student', 'green', 'active', '2010-07-11', 'Patrick Murphy', '555-3501', NULL, 'Brave like his father, natural leader', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '357 Hero Street', 'New York', 'NY', '10035', 'male', '3503'),
('f8000001-0000-0000-0000-000000000004', 'bridget.murphy@email.com', 'Bridget', 'Murphy', '555-3504', 'student', 'orange', 'active', '2013-03-28', 'Patrick Murphy', '555-3501', NULL, 'Energetic and determined', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '357 Hero Street', 'New York', 'NY', '10035', 'female', '3504'),

-- Final set of individual students
('d5000001-0000-0000-0000-000000000001', 'tech.nelson@email.com', 'Steven', 'Nelson', '555-3601', 'student', 'blue', 'active', '1993-10-07', 'Amy Nelson', '555-3602', NULL, 'Software developer, analytical approach', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '468 Tech Drive', 'New York', 'NY', '10036', 'male', '3601'),
('d5000001-0000-0000-0000-000000000002', 'teacher.scott@email.com', 'Michelle', 'Scott', '555-3701', 'student', 'orange', 'active', '1987-04-15', 'John Scott', '555-3702', NULL, 'Elementary teacher, loves working with kids', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '579 Education Lane', 'New York', 'NY', '10037', 'female', '3701'),
('d5000001-0000-0000-0000-000000000003', 'lawyer.evans@email.com', 'Christopher', 'Evans', '555-3801', 'student', 'purple', 'active', '1983-12-02', 'Sarah Evans', '555-3802', NULL, 'Lawyer, competitive and driven', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '681 Justice Boulevard', 'New York', 'NY', '10038', 'male', '3801'),
('d5000001-0000-0000-0000-000000000004', 'nurse.baker@email.com', 'Kelly', 'Baker', '555-3901', 'student', 'red', 'active', '1990-06-29', 'Mike Baker', '555-3902', NULL, 'ICU nurse, handles pressure well', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '792 Healthcare Way', 'New York', 'NY', '10039', 'female', '3901'),

-- Additional prospects and special cases
('p3000001-0000-0000-0000-000000000001', 'returning.hall@email.com', 'Joseph', 'Hall', '555-4001', 'student', 'blue', 'inactive', '1985-09-13', 'Lisa Hall', '555-4002', NULL, 'Former student considering return', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '135 Comeback Circle', 'New York', 'NY', '10040', 'male', '4001'),
('p3000001-0000-0000-0000-000000000002', 'interested.parker@email.com', 'Monica', 'Parker', '555-4101', 'prospect', NULL, 'trial', '1992-11-21', 'Tony Parker', '555-4102', NULL, 'Friend referred her, very interested', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '246 Referral Road', 'New York', 'NY', '10041', 'female', '4101'),

-- Final family - Family 9: The Foster Family
('f9000001-0000-0000-0000-000000000001', 'andrew.foster@email.com', 'Andrew', 'Foster', '555-4201', 'parent', NULL, 'active', '1979-07-08', 'Rebecca Foster', '555-4202', NULL, 'Bank manager, values discipline and respect', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '357 Financial Street', 'New York', 'NY', '10042', 'male', '4201'),
('f9000001-0000-0000-0000-000000000002', 'rebecca.foster@email.com', 'Rebecca', 'Foster', '555-4202', 'parent', NULL, 'active', '1981-12-16', 'Andrew Foster', '555-4201', NULL, 'Marketing director, supportive parent', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '357 Financial Street', 'New York', 'NY', '10042', 'female', '4202'),
('f9000001-0000-0000-0000-000000000003', 'jacob.foster@email.com', 'Jacob', 'Foster', '555-4203', 'student', 'yellow', 'active', '2011-09-05', 'Andrew Foster', '555-4201', NULL, 'Smart and focused student', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '357 Financial Street', 'New York', 'NY', '10042', 'male', '4203'),
('f9000001-0000-0000-0000-000000000004', 'grace.foster@email.com', 'Grace', 'Foster', '555-4204', 'student', 'white', 'active', '2014-05-23', 'Andrew Foster', '555-4201', NULL, 'Youngest student, full of energy', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '357 Financial Street', 'New York', 'NY', '10042', 'female', '4204'),

-- Final individual students to reach 100
('d6000001-0000-0000-0000-000000000001', 'chef.rivera@email.com', 'Carlos', 'Rivera', '555-4301', 'student', 'brown', 'active', '1986-02-11', 'Maria Rivera', '555-4302', NULL, 'Professional chef, disciplined and focused', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '468 Culinary Court', 'New York', 'NY', '10043', 'male', '4301'),
('d6000001-0000-0000-0000-000000000002', 'photographer.cox@email.com', 'Stephanie', 'Cox', '555-4401', 'student', 'green', 'active', '1994-08-03', 'Daniel Cox', '555-4402', NULL, 'Photographer, artistic and patient', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '579 Creative Avenue', 'New York', 'NY', '10044', 'female', '4401'),
('d6000001-0000-0000-0000-000000000003', 'mechanic.ward@email.com', 'Frank', 'Ward', '555-4501', 'student', 'orange', 'active', '1981-05-27', 'Linda Ward', '555-4502', 'Lower back issues', 'Auto mechanic, hands-on learner', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '681 Workshop Way', 'New York', 'NY', '10045', 'male', '4501'),
('d6000001-0000-0000-0000-000000000004', 'librarian.torres@email.com', 'Angela', 'Torres', '555-4601', 'student', 'yellow', 'active', '1988-10-14', 'Roberto Torres', '555-4602', NULL, 'Librarian, quiet but determined', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '792 Knowledge Drive', 'New York', 'NY', '10046', 'female', '4601'),
('d6000001-0000-0000-0000-000000000005', 'salesman.gray@email.com', 'Matthew', 'Gray', '555-4701', 'student', 'blue', 'active', '1975-01-30', 'Carol Gray', '555-4702', NULL, 'Car salesman, charismatic and outgoing', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '135 Commerce Street', 'New York', 'NY', '10047', 'male', '4701'),
('d6000001-0000-0000-0000-000000000006', 'counselor.james@email.com', 'Deborah', 'James', '555-4801', 'student', 'purple', 'active', '1983-07-19', 'Kevin James', '555-4802', NULL, 'School counselor, empathetic and wise', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '246 Guidance Lane', 'New York', 'NY', '10048', 'female', '4801'),
('d6000001-0000-0000-0000-000000000007', 'electrician.watson@email.com', 'Gary', 'Watson', '555-4901', 'student', 'red', 'active', '1978-04-06', 'Susan Watson', '555-4902', NULL, 'Master electrician, precise and careful', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '357 Power Street', 'New York', 'NY', '10049', 'male', '4901'),
('d6000001-0000-0000-0000-000000000008', 'therapist.brooks@email.com', 'Helen', 'Brooks', '555-5001', 'student', 'black_1st_dan', 'active', '1980-12-25', 'Paul Brooks', '555-5002', NULL, 'Physical therapist, understands body mechanics', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '468 Healing Drive', 'New York', 'NY', '10050', 'female', '5001');

-- Create family relationships
INSERT INTO public.family_relationships (primary_contact_id, related_contact_id, relationship_type, is_emergency_contact, notes) VALUES
-- Johnson Family relationships
('f1000001-0000-0000-0000-000000000001', 'f1000001-0000-0000-0000-000000000002', 'spouse', true, 'Married couple'),
('f1000001-0000-0000-0000-000000000002', 'f1000001-0000-0000-0000-000000000001', 'spouse', true, 'Married couple'),
('f1000001-0000-0000-0000-000000000001', 'f1000001-0000-0000-0000-000000000003', 'parent', true, 'Father-daughter'),
('f1000001-0000-0000-0000-000000000001', 'f1000001-0000-0000-0000-000000000004', 'parent', true, 'Father-son'),
('f1000001-0000-0000-0000-000000000002', 'f1000001-0000-0000-0000-000000000003', 'parent', true, 'Mother-daughter'),
('f1000001-0000-0000-0000-000000000002', 'f1000001-0000-0000-0000-000000000004', 'parent', true, 'Mother-son'),
('f1000001-0000-0000-0000-000000000003', 'f1000001-0000-0000-0000-000000000004', 'sibling', false, 'Sister-brother'),

-- Rodriguez Family relationships
('f2000001-0000-0000-0000-000000000001', 'f2000001-0000-0000-0000-000000000002', 'spouse', true, 'Married couple'),
('f2000001-0000-0000-0000-000000000002', 'f2000001-0000-0000-0000-000000000001', 'spouse', true, 'Married couple'),
('f2000001-0000-0000-0000-000000000001', 'f2000001-0000-0000-0000-000000000003', 'parent', true, 'Father-daughter'),
('f2000001-0000-0000-0000-000000000002', 'f2000001-0000-0000-0000-000000000003', 'parent', true, 'Mother-daughter'),

-- Chen Family relationships
('f3000001-0000-0000-0000-000000000001', 'f3000001-0000-0000-0000-000000000002', 'spouse', true, 'Married couple'),
('f3000001-0000-0000-0000-000000000002', 'f3000001-0000-0000-0000-000000000001', 'spouse', true, 'Married couple'),
('f3000001-0000-0000-0000-000000000001', 'f3000001-0000-0000-0000-000000000003', 'parent', true, 'Father-son'),
('f3000001-0000-0000-0000-000000000001', 'f3000001-0000-0000-0000-000000000004', 'parent', true, 'Father-daughter'),
('f3000001-0000-0000-0000-000000000002', 'f3000001-0000-0000-0000-000000000003', 'parent', true, 'Mother-son'),
('f3000001-0000-0000-0000-000000000002', 'f3000001-0000-0000-0000-000000000004', 'parent', true, 'Mother-daughter'),
('f3000001-0000-0000-0000-000000000003', 'f3000001-0000-0000-0000-000000000004', 'sibling', false, 'Brother-sister'),

-- Patel Family relationships
('f4000001-0000-0000-0000-000000000001', 'f4000001-0000-0000-0000-000000000002', 'spouse', true, 'Married couple'),
('f4000001-0000-0000-0000-000000000002', 'f4000001-0000-0000-0000-000000000001', 'spouse', true, 'Married couple'),
('f4000001-0000-0000-0000-000000000001', 'f4000001-0000-0000-0000-000000000003', 'parent', true, 'Father-son'),
('f4000001-0000-0000-0000-000000000001', 'f4000001-0000-0000-0000-000000000004', 'parent', true, 'Father-daughter'),
('f4000001-0000-0000-0000-000000000002', 'f4000001-0000-0000-0000-000000000003', 'parent', true, 'Mother-son'),
('f4000001-0000-0000-0000-000000000002', 'f4000001-0000-0000-0000-000000000004', 'parent', true, 'Mother-daughter'),
('f4000001-0000-0000-0000-000000000003', 'f4000001-0000-0000-0000-000000000004', 'sibling', false, 'Brother-sister'),

-- O'Brien Family relationships
('f5000001-0000-0000-0000-000000000001', 'f5000001-0000-0000-0000-000000000002', 'spouse', true, 'Married couple'),
('f5000001-0000-0000-0000-000000000002', 'f5000001-0000-0000-0000-000000000001', 'spouse', true, 'Married couple'),
('f5000001-0000-0000-0000-000000000001', 'f5000001-0000-0000-0000-000000000003', 'parent', true, 'Father-son'),
('f5000001-0000-0000-0000-000000000001', 'f5000001-0000-0000-0000-000000000004', 'parent', true, 'Father-daughter'),
('f5000001-0000-0000-0000-000000000002', 'f5000001-0000-0000-0000-000000000003', 'parent', true, 'Mother-son'),
('f5000001-0000-0000-0000-000000000002', 'f5000001-0000-0000-0000-000000000004', 'parent', true, 'Mother-daughter'),
('f5000001-0000-0000-0000-000000000003', 'f5000001-0000-0000-0000-000000000004', 'sibling', false, 'Brother-sister'),

-- Anderson Family relationships
('f6000001-0000-0000-0000-000000000001', 'f6000001-0000-0000-0000-000000000002', 'spouse', true, 'Married couple'),
('f6000001-0000-0000-0000-000000000002', 'f6000001-0000-0000-0000-000000000001', 'spouse', true, 'Married couple'),
('f6000001-0000-0000-0000-000000000001', 'f6000001-0000-0000-0000-000000000003', 'parent', true, 'Father-son'),
('f6000001-0000-0000-0000-000000000001', 'f6000001-0000-0000-0000-000000000004', 'parent', true, 'Father-daughter'),
('f6000001-0000-0000-0000-000000000002', 'f6000001-0000-0000-0000-000000000003', 'parent', true, 'Mother-son'),
('f6000001-0000-0000-0000-000000000002', 'f6000001-0000-0000-0000-000000000004', 'parent', true, 'Mother-daughter'),
('f6000001-0000-0000-0000-000000000003', 'f6000001-0000-0000-0000-000000000004', 'sibling', false, 'Brother-sister'),

-- Walker Family relationships
('f7000001-0000-0000-0000-000000000001', 'f7000001-0000-0000-0000-000000000002', 'spouse', true, 'Married couple'),
('f7000001-0000-0000-0000-000000000002', 'f7000001-0000-0000-0000-000000000001', 'spouse', true, 'Married couple'),
('f7000001-0000-0000-0000-000000000001', 'f7000001-0000-0000-0000-000000000003', 'parent', true, 'Father-son'),
('f7000001-0000-0000-0000-000000000001', 'f7000001-0000-0000-0000-000000000004', 'parent', true, 'Father-daughter'),
('f7000001-0000-0000-0000-000000000002', 'f7000001-0000-0000-0000-000000000003', 'parent', true, 'Mother-son'),
('f7000001-0000-0000-0000-000000000002', 'f7000001-0000-0000-0000-000000000004', 'parent', true, 'Mother-daughter'),
('f7000001-0000-0000-0000-000000000003', 'f7000001-0000-0000-0000-000000000004', 'sibling', false, 'Brother-sister'),

-- Murphy Family relationships
('f8000001-0000-0000-0000-000000000001', 'f8000001-0000-0000-0000-000000000002', 'spouse', true, 'Married couple'),
('f8000001-0000-0000-0000-000000000002', 'f8000001-0000-0000-0000-000000000001', 'spouse', true, 'Married couple'),
('f8000001-0000-0000-0000-000000000001', 'f8000001-0000-0000-0000-000000000003', 'parent', true, 'Father-son'),
('f8000001-0000-0000-0000-000000000001', 'f8000001-0000-0000-0000-000000000004', 'parent', true, 'Father-daughter'),
('f8000001-0000-0000-0000-000000000002', 'f8000001-0000-0000-0000-000000000003', 'parent', true, 'Mother-son'),
('f8000001-0000-0000-0000-000000000002', 'f8000001-0000-0000-0000-000000000004', 'parent', true, 'Mother-daughter'),
('f8000001-0000-0000-0000-000000000003', 'f8000001-0000-0000-0000-000000000004', 'sibling', false, 'Brother-sister'),

-- Foster Family relationships
('f9000001-0000-0000-0000-000000000001', 'f9000001-0000-0000-0000-000000000002', 'spouse', true, 'Married couple'),
('f9000001-0000-0000-0000-000000000002', 'f9000001-0000-0000-0000-000000000001', 'spouse', true, 'Married couple'),
('f9000001-0000-0000-0000-000000000001', 'f9000001-0000-0000-0000-000000000003', 'parent', true, 'Father-son'),
('f9000001-0000-0000-0000-000000000001', 'f9000001-0000-0000-0000-000000000004', 'parent', true, 'Father-daughter'),
('f9000001-0000-0000-0000-000000000002', 'f9000001-0000-0000-0000-000000000003', 'parent', true, 'Mother-son'),
('f9000001-0000-0000-0000-000000000002', 'f9000001-0000-0000-0000-000000000004', 'parent', true, 'Mother-daughter'),
('f9000001-0000-0000-0000-000000000003', 'f9000001-0000-0000-0000-000000000004', 'sibling', false, 'Brother-sister');

-- Create academy memberships for all contacts
INSERT INTO public.academy_memberships (user_id, academy_id, role, is_active) 
SELECT id, academy_id, role, (membership_status = 'active')
FROM public.profiles 
WHERE academy_id = '90b44e8b-c33a-4a98-bc3c-e9a18f434630';