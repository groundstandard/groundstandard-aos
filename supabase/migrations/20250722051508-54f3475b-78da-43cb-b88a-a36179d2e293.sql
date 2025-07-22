-- Create 100 mock contacts with diverse types and family relationships
-- Using only existing columns in the profiles table
INSERT INTO public.profiles (
  id,
  email,
  first_name,
  last_name,
  phone,
  role,
  belt_level,
  membership_status,
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
('f1000001-0000-0000-0000-000000000001', 'mike.johnson@email.com', 'Mike', 'Johnson', '555-0101', 'parent', NULL, 'active', 'Sarah Johnson', '555-0102', NULL, 'Parent account, born 1985-03-15', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '123 Oak Street', 'New York', 'NY', '10001', 'male', '1001'),
('f1000001-0000-0000-0000-000000000002', 'sarah.johnson@email.com', 'Sarah', 'Johnson', '555-0102', 'parent', NULL, 'active', 'Mike Johnson', '555-0101', NULL, 'Parent account, born 1987-07-22', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '123 Oak Street', 'New York', 'NY', '10001', 'female', '1002'),
('f1000001-0000-0000-0000-000000000003', 'emma.johnson@email.com', 'Emma', 'Johnson', '555-0103', 'student', 'white', 'active', 'Mike Johnson', '555-0101', 'Allergic to peanuts', 'Enthusiastic beginner, born 2010-05-12', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '123 Oak Street', 'New York', 'NY', '10001', 'female', '1003'),
('f1000001-0000-0000-0000-000000000004', 'lucas.johnson@email.com', 'Lucas', 'Johnson', '555-0104', 'student', 'yellow', 'active', 'Mike Johnson', '555-0101', NULL, 'Great form and technique, born 2012-09-08', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '123 Oak Street', 'New York', 'NY', '10001', 'male', '1004'),

-- Family 2: The Rodriguez Family
('f2000001-0000-0000-0000-000000000001', 'carlos.rodriguez@email.com', 'Carlos', 'Rodriguez', '555-0201', 'parent', 'black_1st_dan', 'active', 'Maria Rodriguez', '555-0202', NULL, 'Former competitor, now parent, born 1980-11-30', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '456 Pine Avenue', 'New York', 'NY', '10002', 'male', '2001'),
('f2000001-0000-0000-0000-000000000002', 'maria.rodriguez@email.com', 'Maria', 'Rodriguez', '555-0202', 'parent', NULL, 'active', 'Carlos Rodriguez', '555-0201', 'Diabetes Type 2', 'Very supportive parent, born 1982-04-18', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '456 Pine Avenue', 'New York', 'NY', '10002', 'female', '2002'),
('f2000001-0000-0000-0000-000000000003', 'sofia.rodriguez@email.com', 'Sofia', 'Rodriguez', '555-0203', 'student', 'green', 'active', 'Carlos Rodriguez', '555-0201', NULL, 'Natural talent, very focused, born 2009-12-25', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '456 Pine Avenue', 'New York', 'NY', '10002', 'female', '2003'),

-- Family 3: The Chen Family  
('f3000001-0000-0000-0000-000000000001', 'david.chen@email.com', 'David', 'Chen', '555-0301', 'parent', NULL, 'active', 'Lisa Chen', '555-0302', NULL, 'Works in tech, born 1978-06-14', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '789 Maple Drive', 'New York', 'NY', '10003', 'male', '3001'),
('f3000001-0000-0000-0000-000000000002', 'lisa.chen@email.com', 'Lisa', 'Chen', '555-0302', 'parent', NULL, 'active', 'David Chen', '555-0301', NULL, 'Doctor at local hospital, born 1981-01-28', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '789 Maple Drive', 'New York', 'NY', '10003', 'female', '3002'),
('f3000001-0000-0000-0000-000000000003', 'kevin.chen@email.com', 'Kevin', 'Chen', '555-0303', 'student', 'blue', 'active', 'David Chen', '555-0301', 'Asthma', 'Very disciplined student, born 2011-03-17', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '789 Maple Drive', 'New York', 'NY', '10003', 'male', '3003'),
('f3000001-0000-0000-0000-000000000004', 'amy.chen@email.com', 'Amy', 'Chen', '555-0304', 'student', 'orange', 'active', 'David Chen', '555-0301', NULL, 'Quick learner, loves competitions, born 2013-08-22', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '789 Maple Drive', 'New York', 'NY', '10003', 'female', '3004'),

-- Individual Students (Adult)
('i1000001-0000-0000-0000-000000000001', 'james.wilson@email.com', 'James', 'Wilson', '555-0401', 'student', 'brown', 'active', 'Emily Wilson', '555-0402', NULL, 'College student, part-time, born 1995-02-14', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '321 Cedar Lane', 'New York', 'NY', '10004', 'male', '4001'),
('i1000001-0000-0000-0000-000000000002', 'ashley.davis@email.com', 'Ashley', 'Davis', '555-0501', 'student', 'purple', 'active', 'Michael Davis', '555-0502', 'Previous knee injury', 'Returning after break, born 1992-09-03', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '654 Birch Road', 'New York', 'NY', '10005', 'female', '5001'),
('i1000001-0000-0000-0000-000000000003', 'michael.thompson@email.com', 'Michael', 'Thompson', '555-0601', 'student', 'red', 'active', 'Jennifer Thompson', '555-0602', NULL, 'Training for black belt test, born 1988-12-11', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '987 Elm Street', 'New York', 'NY', '10006', 'male', '6001'),
('i1000001-0000-0000-0000-000000000004', 'jessica.martinez@email.com', 'Jessica', 'Martinez', '555-0701', 'student', 'black_1st_dan', 'active', 'Roberto Martinez', '555-0702', NULL, 'Recently promoted to black belt, born 1990-05-19', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '147 Willow Way', 'New York', 'NY', '10007', 'female', '7001'),
('i1000001-0000-0000-0000-000000000005', 'robert.taylor@email.com', 'Robert', 'Taylor', '555-0801', 'student', 'black_2nd_dan', 'active', 'Linda Taylor', '555-0802', NULL, 'Assistant instructor in training, born 1985-08-07', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '258 Poplar Place', 'New York', 'NY', '10008', 'male', '8001'),

-- Instructors and Staff
('s1000001-0000-0000-0000-000000000001', 'sensei.kim@email.com', 'Master', 'Kim', '555-0901', 'instructor', 'black_5th_dan', 'active', 'Susan Kim', '555-0902', NULL, 'Head instructor with 25 years experience, born 1975-01-15', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '369 Harmony Drive', 'New York', 'NY', '10009', 'male', '9001'),
('s1000001-0000-0000-0000-000000000002', 'instructor.brown@email.com', 'Sarah', 'Brown', '555-1001', 'instructor', 'black_3rd_dan', 'active', 'Mark Brown', '555-1002', NULL, 'Specializes in youth programs, born 1986-06-22', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '741 Peace Street', 'New York', 'NY', '10010', 'female', '0001'),
('s1000001-0000-0000-0000-000000000003', 'assistant.lee@email.com', 'Daniel', 'Lee', '555-1101', 'instructor', 'black_2nd_dan', 'active', 'Grace Lee', '555-1102', NULL, 'Competition team coach, born 1991-11-08', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '852 Victory Lane', 'New York', 'NY', '10011', 'male', '1101'),

-- Prospects and Trial Members
('p1000001-0000-0000-0000-000000000001', 'prospect.smith@email.com', 'John', 'Smith', '555-1201', 'prospect', NULL, 'trial', 'Jane Smith', '555-1202', NULL, 'Interested in starting martial arts, born 1994-04-12', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '963 Trial Avenue', 'New York', 'NY', '10012', 'male', '1201'),
('p1000001-0000-0000-0000-000000000002', 'trial.williams@email.com', 'Emma', 'Williams', '555-1301', 'prospect', NULL, 'trial', 'Tom Williams', '555-1302', 'Mild anxiety', 'Shy but interested in training, born 2008-07-30', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '159 Explorer Road', 'New York', 'NY', '10013', 'female', '1301'),

-- Inactive/Former Members
('f1000001-0000-0000-0000-000000000005', 'former.garcia@email.com', 'Alex', 'Garcia', '555-1401', 'student', 'green', 'inactive', 'Rosa Garcia', '555-1402', NULL, 'Moved away, may return, born 1993-10-25', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '357 Former Lane', 'New York', 'NY', '10014', 'male', '1401'),
('f1000001-0000-0000-0000-000000000006', 'paused.jones@email.com', 'Megan', 'Jones', '555-1501', 'student', 'blue', 'paused', 'Steve Jones', '555-1502', 'Recovering from surgery', 'Medical leave, plans to return, born 1996-02-18', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '468 Pause Street', 'New York', 'NY', '10015', 'female', '1501'),

-- More diverse individual students and families
('d1000001-0000-0000-0000-000000000001', 'teen.cooper@email.com', 'Tyler', 'Cooper', '555-1601', 'student', 'orange', 'active', 'Rachel Cooper', '555-1602', NULL, 'Teenager, very motivated, born 2007-05-10', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '579 Youth Drive', 'New York', 'NY', '10016', 'male', '1601'),
('d1000001-0000-0000-0000-000000000002', 'adult.morgan@email.com', 'Patricia', 'Morgan', '555-1701', 'student', 'white', 'active', 'William Morgan', '555-1702', 'Arthritis in hands', 'Senior student, loves the mental aspects, born 1972-12-03', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '681 Senior Circle', 'New York', 'NY', '10017', 'female', '1701'),

-- Family 4: The Patel Family
('f4000001-0000-0000-0000-000000000001', 'raj.patel@email.com', 'Raj', 'Patel', '555-1801', 'parent', NULL, 'active', 'Priya Patel', '555-1802', NULL, 'Engineer, very analytical, born 1983-03-28', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '792 Tech Boulevard', 'New York', 'NY', '10018', 'male', '1801'),
('f4000001-0000-0000-0000-000000000002', 'priya.patel@email.com', 'Priya', 'Patel', '555-1802', 'parent', NULL, 'active', 'Raj Patel', '555-1801', NULL, 'Teacher, values discipline, born 1985-08-15', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '792 Tech Boulevard', 'New York', 'NY', '10018', 'female', '1802'),
('f4000001-0000-0000-0000-000000000003', 'arjun.patel@email.com', 'Arjun', 'Patel', '555-1803', 'student', 'yellow', 'active', 'Raj Patel', '555-1801', NULL, 'Good at memorizing forms, born 2010-11-12', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '792 Tech Boulevard', 'New York', 'NY', '10018', 'male', '1803'),
('f4000001-0000-0000-0000-000000000004', 'maya.patel@email.com', 'Maya', 'Patel', '555-1804', 'student', 'white', 'active', 'Raj Patel', '555-1801', NULL, 'Just started, very excited, born 2014-02-07', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '792 Tech Boulevard', 'New York', 'NY', '10018', 'female', '1804'),

-- Continue with 75 more contacts to reach 100 total...
('d2000001-0000-0000-0000-000000000001', 'athlete.jackson@email.com', 'Marcus', 'Jackson', '555-1901', 'student', 'red', 'active', 'Denise Jackson', '555-1902', NULL, 'Former football player, born 1989-07-04', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '135 Athlete Ave', 'New York', 'NY', '10019', 'male', '1901'),
('d2000001-0000-0000-0000-000000000002', 'fitness.white@email.com', 'Amanda', 'White', '555-2001', 'student', 'purple', 'active', 'Brian White', '555-2002', NULL, 'Fitness instructor, loves martial arts, born 1987-01-20', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '246 Fitness Street', 'New York', 'NY', '10020', 'female', '2001'),
('d2000001-0000-0000-0000-000000000003', 'business.adams@email.com', 'Richard', 'Adams', '555-2101', 'student', 'brown', 'active', 'Susan Adams', '555-2102', 'High blood pressure', 'Business owner, stress relief, born 1979-09-16', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '357 Business Blvd', 'New York', 'NY', '10021', 'male', '2101'),

-- Additional 60+ contacts with various roles, ages, and family structures...
('u0000001-0000-0000-0000-000000000025', 'linda.martinez@email.com', 'Linda', 'Martinez', '555-2301', 'student', 'green', 'active', 'Carlos Martinez', '555-2302', NULL, 'Part-time student, born 1994-03-15', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '468 Student Lane', 'New York', 'NY', '10023', 'female', '2301'),
('u0000001-0000-0000-0000-000000000026', 'robert.clark@email.com', 'Robert', 'Clark', '555-2401', 'student', 'blue', 'active', 'Helen Clark', '555-2402', 'Previous shoulder injury', 'Dedicated adult student, born 1985-11-28', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '579 Dedication Drive', 'New York', 'NY', '10024', 'male', '2401'),
('u0000001-0000-0000-0000-000000000027', 'nancy.lewis@email.com', 'Nancy', 'Lewis', '555-2501', 'student', 'yellow', 'active', 'Paul Lewis', '555-2502', NULL, 'Teacher, loves martial arts philosophy, born 1990-07-12', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '681 Philosophy Way', 'New York', 'NY', '10025', 'female', '2501'),
('u0000001-0000-0000-0000-000000000028', 'kevin.wright@email.com', 'Kevin', 'Wright', '555-2601', 'student', 'orange', 'active', 'Sandra Wright', '555-2602', NULL, 'Engineer, methodical approach, born 1988-02-05', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '792 Method Street', 'New York', 'NY', '10026', 'male', '2601'),
('u0000001-0000-0000-0000-000000000029', 'carol.hall@email.com', 'Carol', 'Hall', '555-2701', 'student', 'purple', 'active', 'John Hall', '555-2702', 'Mild arthritis', 'Senior student, inspiring others, born 1968-09-22', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '135 Inspiration Lane', 'New York', 'NY', '10027', 'female', '2701'),
('u0000001-0000-0000-0000-000000000030', 'steve.allen@email.com', 'Steve', 'Allen', '555-2801', 'student', 'red', 'active', 'Mary Allen', '555-2802', NULL, 'Police officer, self-defense focus, born 1982-05-18', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '246 Protection Boulevard', 'New York', 'NY', '10028', 'male', '2801'),
('u0000001-0000-0000-0000-000000000031', 'diane.young@email.com', 'Diane', 'Young', '555-2901', 'prospect', NULL, 'trial', 'Tom Young', '555-2902', NULL, 'Curious about self-defense, born 1995-12-10', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '357 Curiosity Court', 'New York', 'NY', '10029', 'female', '2901'),
('u0000001-0000-0000-0000-000000000032', 'paul.king@email.com', 'Paul', 'King', '555-3001', 'student', 'brown', 'active', 'Lisa King', '555-3002', NULL, 'Doctor, stress management, born 1984-08-14', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '468 Wellness Way', 'New York', 'NY', '10030', 'male', '3001'),
('u0000001-0000-0000-0000-000000000033', 'janet.scott@email.com', 'Janet', 'Scott', '555-3101', 'student', 'green', 'active', 'Mark Scott', '555-3102', NULL, 'Artist, creative expression, born 1991-04-07', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '579 Creative Circle', 'New York', 'NY', '10031', 'female', '3101'),
('u0000001-0000-0000-0000-000000000034', 'brian.adams@email.com', 'Brian', 'Adams', '555-3201', 'student', 'blue', 'active', 'Susan Adams', '555-3202', NULL, 'Accountant, detail-oriented, born 1987-01-25', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '681 Detail Drive', 'New York', 'NY', '10032', 'male', '3201'),
('u0000001-0000-0000-0000-000000000035', 'helen.baker@email.com', 'Helen', 'Baker', '555-3301', 'student', 'yellow', 'active', 'Robert Baker', '555-3302', 'Mild diabetes', 'Nurse, health-conscious, born 1989-10-30', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '792 Health Street', 'New York', 'NY', '10033', 'female', '3301'),
('u0000001-0000-0000-0000-000000000036', 'frank.green@email.com', 'Frank', 'Green', '555-3401', 'student', 'orange', 'active', 'Carol Green', '555-3402', NULL, 'Mechanic, practical approach, born 1980-06-16', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '135 Practical Place', 'New York', 'NY', '10034', 'male', '3401'),
('u0000001-0000-0000-0000-000000000037', 'ruth.parker@email.com', 'Ruth', 'Parker', '555-3501', 'student', 'purple', 'active', 'James Parker', '555-3502', NULL, 'Librarian, quiet strength, born 1993-03-08', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '246 Quiet Lane', 'New York', 'NY', '10035', 'female', '3501'),
('u0000001-0000-0000-0000-000000000038', 'gary.evans@email.com', 'Gary', 'Evans', '555-3601', 'student', 'red', 'active', 'Linda Evans', '555-3602', NULL, 'Electrician, precision work, born 1986-12-03', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '357 Precision Avenue', 'New York', 'NY', '10036', 'male', '3601'),
('u0000001-0000-0000-0000-000000000039', 'betty.turner@email.com', 'Betty', 'Turner', '555-3701', 'student', 'brown', 'active', 'William Turner', '555-3702', 'Previous hip surgery', 'Retired teacher, lifelong learner, born 1962-08-20', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '468 Learning Lane', 'New York', 'NY', '10037', 'female', '3701'),
('u0000001-0000-0000-0000-000000000040', 'donald.phillips@email.com', 'Donald', 'Phillips', '555-3801', 'student', 'green', 'active', 'Mary Phillips', '555-3802', NULL, 'Construction worker, strong build, born 1983-04-14', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '579 Strong Street', 'New York', 'NY', '10038', 'male', '3801'),
('u0000001-0000-0000-0000-000000000041', 'dorothy.campbell@email.com', 'Dorothy', 'Campbell', '555-3901', 'prospect', NULL, 'trial', 'Robert Campbell', '555-3902', NULL, 'Interested in fitness, born 1996-11-09', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '681 Fitness Court', 'New York', 'NY', '10039', 'female', '3901'),
('u0000001-0000-0000-0000-000000000042', 'kenneth.mitchell@email.com', 'Kenneth', 'Mitchell', '555-4001', 'student', 'blue', 'active', 'Patricia Mitchell', '555-4002', NULL, 'Sales manager, competitive spirit, born 1985-07-27', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '792 Competition Drive', 'New York', 'NY', '10040', 'male', '4001'),
('u0000001-0000-0000-0000-000000000043', 'lisa.roberts@email.com', 'Lisa', 'Roberts', '555-4101', 'student', 'yellow', 'active', 'David Roberts', '555-4102', NULL, 'Chef, disciplined approach, born 1990-02-13', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '135 Discipline Way', 'New York', 'NY', '10041', 'female', '4101'),
('u0000001-0000-0000-0000-000000000044', 'anthony.carter@email.com', 'Anthony', 'Carter', '555-4201', 'student', 'orange', 'active', 'Michelle Carter', '555-4202', 'Mild asthma', 'Software developer, logical mind, born 1992-09-01', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '246 Logic Lane', 'New York', 'NY', '10042', 'male', '4201'),
('u0000001-0000-0000-0000-000000000045', 'sandra.garcia@email.com', 'Sandra', 'Garcia', '555-4301', 'student', 'purple', 'active', 'Carlos Garcia', '555-4302', NULL, 'Social worker, helping others, born 1988-05-19', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '357 Helper Street', 'New York', 'NY', '10043', 'female', '4301'),
('u0000001-0000-0000-0000-000000000046', 'charles.martinez@email.com', 'Charles', 'Martinez', '555-4401', 'student', 'red', 'active', 'Rosa Martinez', '555-4402', NULL, 'Firefighter, brave and strong, born 1981-12-06', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '468 Courage Court', 'New York', 'NY', '10044', 'male', '4401'),
('u0000001-0000-0000-0000-000000000047', 'karen.rodriguez@email.com', 'Karen', 'Rodriguez', '555-4501', 'student', 'brown', 'active', 'Miguel Rodriguez', '555-4502', NULL, 'Therapist, understanding nature, born 1986-08-24', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '579 Understanding Ave', 'New York', 'NY', '10045', 'female', '4501'),
('u0000001-0000-0000-0000-000000000048', 'christopher.lopez@email.com', 'Christopher', 'Lopez', '555-4601', 'student', 'green', 'active', 'Maria Lopez', '555-4602', NULL, 'Lawyer, analytical mind, born 1984-03-11', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '681 Analysis Drive', 'New York', 'NY', '10046', 'male', '4601'),
('u0000001-0000-0000-0000-000000000049', 'deborah.lee@email.com', 'Deborah', 'Lee', '555-4701', 'prospect', NULL, 'trial', 'John Lee', '555-4702', NULL, 'New to martial arts, born 1994-10-28', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '792 Newcomer Place', 'New York', 'NY', '10047', 'female', '4701'),
('u0000001-0000-0000-0000-000000000050', 'matthew.walker@email.com', 'Matthew', 'Walker', '555-4801', 'student', 'blue', 'active', 'Jennifer Walker', '555-4802', NULL, 'Veteran, disciplined approach, born 1979-06-15', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '135 Veteran Way', 'New York', 'NY', '10048', 'male', '4801');

-- Continue adding remaining contacts to reach 100 total
INSERT INTO public.profiles (
  id, email, first_name, last_name, phone, role, belt_level, membership_status,
  emergency_contact_name, emergency_contact_phone, medical_conditions, notes,
  academy_id, address, city, state, zipcode, gender, check_in_pin
) VALUES 
-- Remaining 50 contacts to complete 100 total
('u0000001-0000-0000-0000-000000000051', 'patricia.hall@email.com', 'Patricia', 'Hall', '555-4901', 'student', 'yellow', 'active', 'Michael Hall', '555-4902', NULL, 'Banker, goal-oriented, born 1987-01-22', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '246 Goal Street', 'New York', 'NY', '10049', 'female', '4901'),
('u0000001-0000-0000-0000-000000000052', 'daniel.allen@email.com', 'Daniel', 'Allen', '555-5001', 'student', 'orange', 'active', 'Susan Allen', '555-5002', 'Previous ankle injury', 'Photographer, creative eye, born 1991-11-17', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '357 Creative Drive', 'New York', 'NY', '10050', 'male', '5001'),
('u0000001-0000-0000-0000-000000000053', 'barbara.young@email.com', 'Barbara', 'Young', '555-5101', 'student', 'purple', 'paused', 'Thomas Young', '555-5102', 'Recovering from surgery', 'On medical leave, born 1983-07-04', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '468 Recovery Road', 'New York', 'NY', '10051', 'female', '5101'),
('u0000001-0000-0000-0000-000000000054', 'joseph.hernandez@email.com', 'Joseph', 'Hernandez', '555-5201', 'student', 'red', 'active', 'Carmen Hernandez', '555-5202', NULL, 'Plumber, practical skills, born 1986-04-30', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '579 Practical Way', 'New York', 'NY', '10052', 'male', '5201'),
('u0000001-0000-0000-0000-000000000055', 'susan.nelson@email.com', 'Susan', 'Nelson', '555-5301', 'student', 'brown', 'active', 'Robert Nelson', '555-5302', NULL, 'Real estate agent, people person, born 1989-12-18', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '681 People Place', 'New York', 'NY', '10053', 'female', '5301'),
('u0000001-0000-0000-0000-000000000056', 'thomas.carter@email.com', 'Thomas', 'Carter', '555-5401', 'prospect', NULL, 'trial', 'Lisa Carter', '555-5402', NULL, 'Trying martial arts for fitness, born 1993-09-05', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '792 Trial Lane', 'New York', 'NY', '10054', 'male', '5401'),
('u0000001-0000-0000-0000-000000000057', 'mary.perez@email.com', 'Mary', 'Perez', '555-5501', 'student', 'green', 'active', 'Juan Perez', '555-5502', NULL, 'Office manager, organized, born 1985-05-12', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '135 Organization Ave', 'New York', 'NY', '10055', 'female', '5501'),
('u0000001-0000-0000-0000-000000000058', 'richard.roberts@email.com', 'Richard', 'Roberts', '555-5601', 'student', 'blue', 'active', 'Nancy Roberts', '555-5602', NULL, 'Carpenter, hands-on learner, born 1982-02-28', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '246 Hands-on Street', 'New York', 'NY', '10056', 'male', '5601'),
('u0000001-0000-0000-0000-000000000059', 'jennifer.turner@email.com', 'Jennifer', 'Turner', '555-5701', 'student', 'yellow', 'active', 'Mark Turner', '555-5702', 'Mild scoliosis', 'Physical therapist, body awareness, born 1990-08-15', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '357 Awareness Court', 'New York', 'NY', '10057', 'female', '5701'),
('u0000001-0000-0000-0000-000000000060', 'william.phillips@email.com', 'William', 'Phillips', '555-5801', 'student', 'orange', 'active', 'Helen Phillips', '555-5802', NULL, 'Bus driver, patient nature, born 1987-11-02', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '468 Patience Drive', 'New York', 'NY', '10058', 'male', '5801'),
('u0000001-0000-0000-0000-000000000061', 'elizabeth.campbell@email.com', 'Elizabeth', 'Campbell', '555-5901', 'student', 'purple', 'active', 'James Campbell', '555-5902', NULL, 'Veterinarian, gentle approach, born 1988-06-19', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '579 Gentle Way', 'New York', 'NY', '10059', 'female', '5901'),
('u0000001-0000-0000-0000-000000000062', 'david.parker@email.com', 'David', 'Parker', '555-6001', 'student', 'red', 'inactive', 'Sarah Parker', '555-6002', NULL, 'Former student, considering return, born 1984-03-26', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '681 Return Road', 'New York', 'NY', '10060', 'male', '6001'),
('u0000001-0000-0000-0000-000000000063', 'linda.evans@email.com', 'Linda', 'Evans', '555-6101', 'student', 'brown', 'active', 'Robert Evans', '555-6102', NULL, 'Insurance agent, risk assessment, born 1991-10-13', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '792 Assessment Lane', 'New York', 'NY', '10061', 'female', '6101'),
('u0000001-0000-0000-0000-000000000064', 'mark.edwards@email.com', 'Mark', 'Edwards', '555-6201', 'prospect', NULL, 'trial', 'Carol Edwards', '555-6202', NULL, 'Curious about self-defense, born 1995-07-31', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '135 Defense Drive', 'New York', 'NY', '10062', 'male', '6201'),
('u0000001-0000-0000-0000-000000000065', 'michelle.collins@email.com', 'Michelle', 'Collins', '555-6301', 'student', 'green', 'active', 'Steven Collins', '555-6302', NULL, 'Graphic designer, visual learner, born 1989-04-08', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '246 Visual Street', 'New York', 'NY', '10063', 'female', '6301'),
('u0000001-0000-0000-0000-000000000066', 'paul.stewart@email.com', 'Paul', 'Stewart', '555-6401', 'student', 'blue', 'active', 'Janet Stewart', '555-6402', 'Previous back surgery', 'Delivery driver, physical job, born 1986-12-25', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '357 Delivery Lane', 'New York', 'NY', '10064', 'male', '6401'),
('u0000001-0000-0000-0000-000000000067', 'nancy.sanchez@email.com', 'Nancy', 'Sanchez', '555-6501', 'student', 'yellow', 'active', 'Carlos Sanchez', '555-6502', NULL, 'Secretary, detail-oriented, born 1992-09-12', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '468 Detail Drive', 'New York', 'NY', '10065', 'female', '6501'),
('u0000001-0000-0000-0000-000000000068', 'larry.morris@email.com', 'Larry', 'Morris', '555-6601', 'student', 'orange', 'active', 'Donna Morris', '555-6602', NULL, 'Retired military, disciplined, born 1975-05-29', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '579 Military Way', 'New York', 'NY', '10066', 'male', '6601'),
('u0000001-0000-0000-0000-000000000069', 'donna.rogers@email.com', 'Donna', 'Rogers', '555-6701', 'student', 'purple', 'active', 'Michael Rogers', '555-6702', 'Mild arthritis', 'Senior student, inspiring, born 1971-02-16', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '681 Senior Circle', 'New York', 'NY', '10067', 'female', '6701'),
('u0000001-0000-0000-0000-000000000070', 'frank.reed@email.com', 'Frank', 'Reed', '555-6801', 'student', 'red', 'active', 'Betty Reed', '555-6802', NULL, 'Factory worker, strong build, born 1983-08-03', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '792 Factory Lane', 'New York', 'NY', '10068', 'male', '6801'),
('u0000001-0000-0000-0000-000000000071', 'angela.cook@email.com', 'Angela', 'Cook', '555-6901', 'prospect', NULL, 'trial', 'David Cook', '555-6902', NULL, 'New prospect, friend referred, born 1994-11-20', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '135 Referral Road', 'New York', 'NY', '10069', 'female', '6901'),
('u0000001-0000-0000-0000-000000000072', 'scott.bailey@email.com', 'Scott', 'Bailey', '555-7001', 'student', 'brown', 'active', 'Linda Bailey', '555-7002', NULL, 'Coach, understands training, born 1985-06-07', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '246 Training Avenue', 'New York', 'NY', '10070', 'male', '7001'),
('u0000001-0000-0000-0000-000000000073', 'carol.rivera@email.com', 'Carol', 'Rivera', '555-7101', 'student', 'green', 'active', 'Miguel Rivera', '555-7102', NULL, 'Counselor, patient nature, born 1990-01-24', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '357 Patience Street', 'New York', 'NY', '10071', 'female', '7101'),
('u0000001-0000-0000-0000-000000000074', 'gregory.cooper@email.com', 'Gregory', 'Cooper', '555-7201', 'student', 'blue', 'active', 'Susan Cooper', '555-7202', NULL, 'Electrician, precise work, born 1987-10-11', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '468 Precision Court', 'New York', 'NY', '10072', 'male', '7201'),
('u0000001-0000-0000-0000-000000000075', 'debra.richardson@email.com', 'Debra', 'Richardson', '555-7301', 'student', 'yellow', 'active', 'John Richardson', '555-7302', 'Previous wrist injury', 'Massage therapist, body awareness, born 1988-07-28', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '579 Body Awareness Way', 'New York', 'NY', '10073', 'female', '7301'),
('u0000001-0000-0000-0000-000000000076', 'peter.cox@email.com', 'Peter', 'Cox', '555-7401', 'student', 'orange', 'active', 'Mary Cox', '555-7402', NULL, 'Taxi driver, city knowledge, born 1981-04-15', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '681 City Street', 'New York', 'NY', '10074', 'male', '7401'),
('u0000001-0000-0000-0000-000000000077', 'rachel.ward@email.com', 'Rachel', 'Ward', '555-7501', 'student', 'purple', 'active', 'Kevin Ward', '555-7502', NULL, 'Pharmacist, precise nature, born 1989-12-02', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '792 Precise Place', 'New York', 'NY', '10075', 'female', '7501'),
('u0000001-0000-0000-0000-000000000078', 'harold.torres@email.com', 'Harold', 'Torres', '555-7601', 'student', 'red', 'active', 'Gloria Torres', '555-7602', NULL, 'Mechanic, problem solver, born 1984-08-19', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '135 Problem Solver Ave', 'New York', 'NY', '10076', 'male', '7601'),
('u0000001-0000-0000-0000-000000000079', 'carolyn.peterson@email.com', 'Carolyn', 'Peterson', '555-7701', 'prospect', NULL, 'trial', 'William Peterson', '555-7702', NULL, 'Interested in fitness program, born 1993-05-06', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '246 Fitness Lane', 'New York', 'NY', '10077', 'female', '7701'),
('u0000001-0000-0000-0000-000000000080', 'arthur.gray@email.com', 'Arthur', 'Gray', '555-7801', 'student', 'brown', 'active', 'Dorothy Gray', '555-7802', 'Mild hearing loss', 'Retired professor, intellectual, born 1965-11-23', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '357 Intellectual Drive', 'New York', 'NY', '10078', 'male', '7801'),
('u0000001-0000-0000-0000-000000000081', 'julie.ramirez@email.com', 'Julie', 'Ramirez', '555-7901', 'student', 'green', 'active', 'Roberto Ramirez', '555-7902', NULL, 'Flight attendant, travel experience, born 1990-08-10', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '468 Travel Court', 'New York', 'NY', '10079', 'female', '7901'),
('u0000001-0000-0000-0000-000000000082', 'wayne.james@email.com', 'Wayne', 'James', '555-8001', 'student', 'blue', 'active', 'Patricia James', '555-8002', NULL, 'Security guard, protective nature, born 1986-03-27', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '579 Security Street', 'New York', 'NY', '10080', 'male', '8001'),
('u0000001-0000-0000-0000-000000000083', 'joyce.watson@email.com', 'Joyce', 'Watson', '555-8101', 'student', 'yellow', 'active', 'Charles Watson', '555-8102', NULL, 'Hairdresser, people skills, born 1991-10-14', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '681 People Way', 'New York', 'NY', '10081', 'female', '8101'),
('u0000001-0000-0000-0000-000000000084', 'louis.brooks@email.com', 'Louis', 'Brooks', '555-8201', 'student', 'orange', 'active', 'Helen Brooks', '555-8202', 'Previous shoulder surgery', 'Postal worker, steady routine, born 1983-07-01', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '792 Routine Road', 'New York', 'NY', '10082', 'male', '8201'),
('u0000001-0000-0000-0000-000000000085', 'marie.kelly@email.com', 'Marie', 'Kelly', '555-8301', 'student', 'purple', 'active', 'Patrick Kelly', '555-8302', NULL, 'Dental hygienist, attention to detail, born 1988-04-18', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '135 Detail Lane', 'New York', 'NY', '10083', 'female', '8301'),
('u0000001-0000-0000-0000-000000000086', 'ralph.sanders@email.com', 'Ralph', 'Sanders', '555-8401', 'student', 'red', 'active', 'Barbara Sanders', '555-8402', NULL, 'Truck driver, long-distance mindset, born 1982-12-05', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '246 Distance Drive', 'New York', 'NY', '10084', 'male', '8401'),
('u0000001-0000-0000-0000-000000000087', 'janice.price@email.com', 'Janice', 'Price', '555-8501', 'prospect', NULL, 'trial', 'Michael Price', '555-8502', NULL, 'New to area, exploring options, born 1994-09-22', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '357 Explorer Avenue', 'New York', 'NY', '10085', 'female', '8501'),
('u0000001-0000-0000-0000-000000000088', 'roy.bennett@email.com', 'Roy', 'Bennett', '555-8601', 'student', 'brown', 'active', 'Ruth Bennett', '555-8602', NULL, 'Farmer, strong work ethic, born 1979-06-09', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '468 Work Ethic Way', 'New York', 'NY', '10086', 'male', '8601'),
('u0000001-0000-0000-0000-000000000089', 'eugene.wood@email.com', 'Eugene', 'Wood', '555-8701', 'student', 'green', 'active', 'Alice Wood', '555-8702', 'Mild diabetes', 'Retired carpenter, patient teacher, born 1963-02-26', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '579 Teacher Street', 'New York', 'NY', '10087', 'male', '8701'),
('u0000001-0000-0000-0000-000000000090', 'kathryn.barnes@email.com', 'Kathryn', 'Barnes', '555-8801', 'student', 'blue', 'active', 'George Barnes', '555-8802', NULL, 'Museum curator, appreciates tradition, born 1987-11-13', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '681 Tradition Court', 'New York', 'NY', '10088', 'female', '8801'),
('u0000001-0000-0000-0000-000000000091', 'jimmy.ross@email.com', 'Jimmy', 'Ross', '555-8901', 'student', 'yellow', 'active', 'Sandra Ross', '555-8902', NULL, 'Landscaper, outdoor worker, born 1985-08-30', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '792 Outdoor Place', 'New York', 'NY', '10089', 'male', '8901'),
('u0000001-0000-0000-0000-000000000092', 'gloria.henderson@email.com', 'Gloria', 'Henderson', '555-9001', 'student', 'orange', 'active', 'Larry Henderson', '555-9002', 'Previous knee replacement', 'Retired nurse, caring nature, born 1968-05-17', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '135 Caring Lane', 'New York', 'NY', '10090', 'female', '9001'),
('u0000001-0000-0000-0000-000000000093', 'gerald.coleman@email.com', 'Gerald', 'Coleman', '555-9101', 'student', 'purple', 'active', 'Brenda Coleman', '555-9102', NULL, 'Bank teller, customer service, born 1983-01-04', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '246 Service Street', 'New York', 'NY', '10091', 'male', '9101'),
('u0000001-0000-0000-0000-000000000094', 'teresa.jenkins@email.com', 'Teresa', 'Jenkins', '555-9201', 'student', 'red', 'active', 'Ronald Jenkins', '555-9202', NULL, 'Restaurant manager, leadership skills, born 1989-09-21', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '357 Leadership Drive', 'New York', 'NY', '10092', 'female', '9201'),
('u0000001-0000-0000-0000-000000000095', 'phillip.perry@email.com', 'Phillip', 'Perry', '555-9301', 'student', 'brown', 'active', 'Nancy Perry', '555-9302', NULL, 'Journalist, curious mind, born 1986-06-08', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '468 Curiosity Court', 'New York', 'NY', '10093', 'male', '9301'),
('u0000001-0000-0000-0000-000000000096', 'jean.powell@email.com', 'Jean', 'Powell', '555-9401', 'prospect', NULL, 'trial', 'Walter Powell', '555-9402', NULL, 'Considering martial arts for grandchildren, born 1965-03-25', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '579 Family Way', 'New York', 'NY', '10094', 'female', '9401'),
('u0000001-0000-0000-0000-000000000097', 'martin.long@email.com', 'Martin', 'Long', '555-9501', 'student', 'green', 'active', 'Karen Long', '555-9502', 'Previous heart surgery', 'Doctor recommended exercise, born 1972-10-12', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '681 Exercise Lane', 'New York', 'NY', '10095', 'male', '9501'),
('u0000001-0000-0000-0000-000000000098', 'rose.hughes@email.com', 'Rose', 'Hughes', '555-9601', 'student', 'blue', 'active', 'Edward Hughes', '555-9602', NULL, 'Florist, gentle nature, born 1990-07-29', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '792 Gentle Street', 'New York', 'NY', '10096', 'female', '9601'),
('u0000001-0000-0000-0000-000000000099', 'albert.flores@email.com', 'Albert', 'Flores', '555-9701', 'student', 'yellow', 'active', 'Maria Flores', '555-9702', NULL, 'Janitor, humble hardworker, born 1978-04-16', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '135 Hardwork Avenue', 'New York', 'NY', '10097', 'male', '9701'),
('u0000001-0000-0000-0000-000000000100', 'frances.washington@email.com', 'Frances', 'Washington', '555-9801', 'student', 'orange', 'active', 'James Washington', '555-9802', NULL, 'School principal, leadership experience, born 1984-12-03', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '246 Leadership Place', 'New York', 'NY', '10098', 'female', '9801');

-- Create family relationships for the major families
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
('f4000001-0000-0000-0000-000000000003', 'f4000001-0000-0000-0000-000000000004', 'sibling', false, 'Brother-sister');

-- Create academy memberships for all contacts
INSERT INTO public.academy_memberships (user_id, academy_id, role, is_active) 
SELECT id, academy_id, role, (membership_status = 'active')
FROM public.profiles 
WHERE academy_id = '90b44e8b-c33a-4a98-bc3c-e9a18f434630';