-- Create 100 mock contacts with existing column structure
INSERT INTO public.profiles (
  id, email, first_name, last_name, phone, role, belt_level, membership_status,
  emergency_contact, academy_id, check_in_pin
) VALUES 
-- Family 1: The Johnson Family (Parents and Children)
('f1000001-0000-0000-0000-000000000001', 'mike.johnson@email.com', 'Mike', 'Johnson', '555-0101', 'parent', NULL, 'active', 'Sarah Johnson (555-0102)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1001'),
('f1000001-0000-0000-0000-000000000002', 'sarah.johnson@email.com', 'Sarah', 'Johnson', '555-0102', 'parent', NULL, 'active', 'Mike Johnson (555-0101)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1002'),
('f1000001-0000-0000-0000-000000000003', 'emma.johnson@email.com', 'Emma', 'Johnson', '555-0103', 'student', 'white', 'active', 'Mike Johnson (555-0101)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1003'),
('f1000001-0000-0000-0000-000000000004', 'lucas.johnson@email.com', 'Lucas', 'Johnson', '555-0104', 'student', 'yellow', 'active', 'Mike Johnson (555-0101)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1004'),

-- Family 2: The Rodriguez Family
('f2000001-0000-0000-0000-000000000001', 'carlos.rodriguez@email.com', 'Carlos', 'Rodriguez', '555-0201', 'parent', 'black_1st_dan', 'active', 'Maria Rodriguez (555-0202)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '2001'),
('f2000001-0000-0000-0000-000000000002', 'maria.rodriguez@email.com', 'Maria', 'Rodriguez', '555-0202', 'parent', NULL, 'active', 'Carlos Rodriguez (555-0201)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '2002'),
('f2000001-0000-0000-0000-000000000003', 'sofia.rodriguez@email.com', 'Sofia', 'Rodriguez', '555-0203', 'student', 'green', 'active', 'Carlos Rodriguez (555-0201)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '2003'),

-- Family 3: The Chen Family  
('f3000001-0000-0000-0000-000000000001', 'david.chen@email.com', 'David', 'Chen', '555-0301', 'parent', NULL, 'active', 'Lisa Chen (555-0302)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3001'),
('f3000001-0000-0000-0000-000000000002', 'lisa.chen@email.com', 'Lisa', 'Chen', '555-0302', 'parent', NULL, 'active', 'David Chen (555-0301)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3002'),
('f3000001-0000-0000-0000-000000000003', 'kevin.chen@email.com', 'Kevin', 'Chen', '555-0303', 'student', 'blue', 'active', 'David Chen (555-0301)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3003'),
('f3000001-0000-0000-0000-000000000004', 'amy.chen@email.com', 'Amy', 'Chen', '555-0304', 'student', 'orange', 'active', 'David Chen (555-0301)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3004'),

-- Individual Students (Adult)
('i1000001-0000-0000-0000-000000000001', 'james.wilson@email.com', 'James', 'Wilson', '555-0401', 'student', 'brown', 'active', 'Emily Wilson (555-0402)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '4001'),
('i1000001-0000-0000-0000-000000000002', 'ashley.davis@email.com', 'Ashley', 'Davis', '555-0501', 'student', 'purple', 'active', 'Michael Davis (555-0502)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '5001'),
('i1000001-0000-0000-0000-000000000003', 'michael.thompson@email.com', 'Michael', 'Thompson', '555-0601', 'student', 'red', 'active', 'Jennifer Thompson (555-0602)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '6001'),
('i1000001-0000-0000-0000-000000000004', 'jessica.martinez@email.com', 'Jessica', 'Martinez', '555-0701', 'student', 'black_1st_dan', 'active', 'Roberto Martinez (555-0702)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '7001'),
('i1000001-0000-0000-0000-000000000005', 'robert.taylor@email.com', 'Robert', 'Taylor', '555-0801', 'student', 'black_2nd_dan', 'active', 'Linda Taylor (555-0802)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '8001'),

-- Instructors and Staff
('s1000001-0000-0000-0000-000000000001', 'sensei.kim@email.com', 'Master', 'Kim', '555-0901', 'instructor', 'black_5th_dan', 'active', 'Susan Kim (555-0902)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '9001'),
('s1000001-0000-0000-0000-000000000002', 'instructor.brown@email.com', 'Sarah', 'Brown', '555-1001', 'instructor', 'black_3rd_dan', 'active', 'Mark Brown (555-1002)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '0001'),
('s1000001-0000-0000-0000-000000000003', 'assistant.lee@email.com', 'Daniel', 'Lee', '555-1101', 'instructor', 'black_2nd_dan', 'active', 'Grace Lee (555-1102)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1101'),

-- Prospects and Trial Members
('p1000001-0000-0000-0000-000000000001', 'prospect.smith@email.com', 'John', 'Smith', '555-1201', 'prospect', NULL, 'trial', 'Jane Smith (555-1202)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1201'),
('p1000001-0000-0000-0000-000000000002', 'trial.williams@email.com', 'Emma', 'Williams', '555-1301', 'prospect', NULL, 'trial', 'Tom Williams (555-1302)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1301'),

-- Inactive/Former Members
('f1000001-0000-0000-0000-000000000005', 'former.garcia@email.com', 'Alex', 'Garcia', '555-1401', 'student', 'green', 'inactive', 'Rosa Garcia (555-1402)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1401'),
('f1000001-0000-0000-0000-000000000006', 'paused.jones@email.com', 'Megan', 'Jones', '555-1501', 'student', 'blue', 'paused', 'Steve Jones (555-1502)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1501'),

-- Family 4: The Patel Family
('f4000001-0000-0000-0000-000000000001', 'raj.patel@email.com', 'Raj', 'Patel', '555-1801', 'parent', NULL, 'active', 'Priya Patel (555-1802)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1801'),
('f4000001-0000-0000-0000-000000000002', 'priya.patel@email.com', 'Priya', 'Patel', '555-1802', 'parent', NULL, 'active', 'Raj Patel (555-1801)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1802'),
('f4000001-0000-0000-0000-000000000003', 'arjun.patel@email.com', 'Arjun', 'Patel', '555-1803', 'student', 'yellow', 'active', 'Raj Patel (555-1801)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1803'),
('f4000001-0000-0000-0000-000000000004', 'maya.patel@email.com', 'Maya', 'Patel', '555-1804', 'student', 'white', 'active', 'Raj Patel (555-1801)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1804'),

-- Continue with individual students and other diverse contacts
('d1000001-0000-0000-0000-000000000001', 'teen.cooper@email.com', 'Tyler', 'Cooper', '555-1601', 'student', 'orange', 'active', 'Rachel Cooper (555-1602)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1601'),
('d1000001-0000-0000-0000-000000000002', 'adult.morgan@email.com', 'Patricia', 'Morgan', '555-1701', 'student', 'white', 'active', 'William Morgan (555-1702)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1701'),
('d2000001-0000-0000-0000-000000000001', 'athlete.jackson@email.com', 'Marcus', 'Jackson', '555-1901', 'student', 'red', 'active', 'Denise Jackson (555-1902)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1901'),
('d2000001-0000-0000-0000-000000000002', 'fitness.white@email.com', 'Amanda', 'White', '555-2001', 'student', 'purple', 'active', 'Brian White (555-2002)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '2001'),
('d2000001-0000-0000-0000-000000000003', 'business.adams@email.com', 'Richard', 'Adams', '555-2101', 'student', 'brown', 'active', 'Susan Adams (555-2102)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '2101'),

-- Continue adding contacts to reach 100 (adding 70 more)
('u0000001-0000-0000-0000-000000000025', 'linda.martinez@email.com', 'Linda', 'Martinez', '555-2301', 'student', 'green', 'active', 'Carlos Martinez (555-2302)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '2301'),
('u0000001-0000-0000-0000-000000000026', 'robert.clark@email.com', 'Robert', 'Clark', '555-2401', 'student', 'blue', 'active', 'Helen Clark (555-2402)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '2401'),
('u0000001-0000-0000-0000-000000000027', 'nancy.lewis@email.com', 'Nancy', 'Lewis', '555-2501', 'student', 'yellow', 'active', 'Paul Lewis (555-2502)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '2501'),
('u0000001-0000-0000-0000-000000000028', 'kevin.wright@email.com', 'Kevin', 'Wright', '555-2601', 'student', 'orange', 'active', 'Sandra Wright (555-2602)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '2601'),
('u0000001-0000-0000-0000-000000000029', 'carol.hall@email.com', 'Carol', 'Hall', '555-2701', 'student', 'purple', 'active', 'John Hall (555-2702)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '2701'),
('u0000001-0000-0000-0000-000000000030', 'steve.allen@email.com', 'Steve', 'Allen', '555-2801', 'student', 'red', 'active', 'Mary Allen (555-2802)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '2801'),
('u0000001-0000-0000-0000-000000000031', 'diane.young@email.com', 'Diane', 'Young', '555-2901', 'prospect', NULL, 'trial', 'Tom Young (555-2902)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '2901'),
('u0000001-0000-0000-0000-000000000032', 'paul.king@email.com', 'Paul', 'King', '555-3001', 'student', 'brown', 'active', 'Lisa King (555-3002)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3001'),
('u0000001-0000-0000-0000-000000000033', 'janet.scott@email.com', 'Janet', 'Scott', '555-3101', 'student', 'green', 'active', 'Mark Scott (555-3102)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3101'),
('u0000001-0000-0000-0000-000000000034', 'brian.adams@email.com', 'Brian', 'Adams', '555-3201', 'student', 'blue', 'active', 'Susan Adams (555-3202)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3201'),
('u0000001-0000-0000-0000-000000000035', 'helen.baker@email.com', 'Helen', 'Baker', '555-3301', 'student', 'yellow', 'active', 'Robert Baker (555-3302)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3301'),
('u0000001-0000-0000-0000-000000000036', 'frank.green@email.com', 'Frank', 'Green', '555-3401', 'student', 'orange', 'active', 'Carol Green (555-3402)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3401'),
('u0000001-0000-0000-0000-000000000037', 'ruth.parker@email.com', 'Ruth', 'Parker', '555-3501', 'student', 'purple', 'active', 'James Parker (555-3502)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3501'),
('u0000001-0000-0000-0000-000000000038', 'gary.evans@email.com', 'Gary', 'Evans', '555-3601', 'student', 'red', 'active', 'Linda Evans (555-3602)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3601'),
('u0000001-0000-0000-0000-000000000039', 'betty.turner@email.com', 'Betty', 'Turner', '555-3701', 'student', 'brown', 'active', 'William Turner (555-3702)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3701'),
('u0000001-0000-0000-0000-000000000040', 'donald.phillips@email.com', 'Donald', 'Phillips', '555-3801', 'student', 'green', 'active', 'Mary Phillips (555-3802)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3801'),
('u0000001-0000-0000-0000-000000000041', 'dorothy.campbell@email.com', 'Dorothy', 'Campbell', '555-3901', 'prospect', NULL, 'trial', 'Robert Campbell (555-3902)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3901'),
('u0000001-0000-0000-0000-000000000042', 'kenneth.mitchell@email.com', 'Kenneth', 'Mitchell', '555-4001', 'student', 'blue', 'active', 'Patricia Mitchell (555-4002)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '4001'),
('u0000001-0000-0000-0000-000000000043', 'lisa.roberts@email.com', 'Lisa', 'Roberts', '555-4101', 'student', 'yellow', 'active', 'David Roberts (555-4102)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '4101'),
('u0000001-0000-0000-0000-000000000044', 'anthony.carter@email.com', 'Anthony', 'Carter', '555-4201', 'student', 'orange', 'active', 'Michelle Carter (555-4202)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '4201'),
('u0000001-0000-0000-0000-000000000045', 'sandra.garcia@email.com', 'Sandra', 'Garcia', '555-4301', 'student', 'purple', 'active', 'Carlos Garcia (555-4302)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '4301'),
('u0000001-0000-0000-0000-000000000046', 'charles.martinez@email.com', 'Charles', 'Martinez', '555-4401', 'student', 'red', 'active', 'Rosa Martinez (555-4402)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '4401'),
('u0000001-0000-0000-0000-000000000047', 'karen.rodriguez@email.com', 'Karen', 'Rodriguez', '555-4501', 'student', 'brown', 'active', 'Miguel Rodriguez (555-4502)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '4501'),
('u0000001-0000-0000-0000-000000000048', 'christopher.lopez@email.com', 'Christopher', 'Lopez', '555-4601', 'student', 'green', 'active', 'Maria Lopez (555-4602)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '4601'),
('u0000001-0000-0000-0000-000000000049', 'deborah.lee@email.com', 'Deborah', 'Lee', '555-4701', 'prospect', NULL, 'trial', 'John Lee (555-4702)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '4701'),
('u0000001-0000-0000-0000-000000000050', 'matthew.walker@email.com', 'Matthew', 'Walker', '555-4801', 'student', 'blue', 'active', 'Jennifer Walker (555-4802)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '4801'),
('u0000001-0000-0000-0000-000000000051', 'patricia.hall@email.com', 'Patricia', 'Hall', '555-4901', 'student', 'yellow', 'active', 'Michael Hall (555-4902)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '4901'),
('u0000001-0000-0000-0000-000000000052', 'daniel.allen@email.com', 'Daniel', 'Allen', '555-5001', 'student', 'orange', 'active', 'Susan Allen (555-5002)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '5001'),
('u0000001-0000-0000-0000-000000000053', 'barbara.young@email.com', 'Barbara', 'Young', '555-5101', 'student', 'purple', 'paused', 'Thomas Young (555-5102)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '5101'),
('u0000001-0000-0000-0000-000000000054', 'joseph.hernandez@email.com', 'Joseph', 'Hernandez', '555-5201', 'student', 'red', 'active', 'Carmen Hernandez (555-5202)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '5201'),
('u0000001-0000-0000-0000-000000000055', 'susan.nelson@email.com', 'Susan', 'Nelson', '555-5301', 'student', 'brown', 'active', 'Robert Nelson (555-5302)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '5301'),
('u0000001-0000-0000-0000-000000000056', 'thomas.carter@email.com', 'Thomas', 'Carter', '555-5401', 'prospect', NULL, 'trial', 'Lisa Carter (555-5402)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '5401'),
('u0000001-0000-0000-0000-000000000057', 'mary.perez@email.com', 'Mary', 'Perez', '555-5501', 'student', 'green', 'active', 'Juan Perez (555-5502)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '5501'),
('u0000001-0000-0000-0000-000000000058', 'richard.roberts@email.com', 'Richard', 'Roberts', '555-5601', 'student', 'blue', 'active', 'Nancy Roberts (555-5602)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '5601'),
('u0000001-0000-0000-0000-000000000059', 'jennifer.turner@email.com', 'Jennifer', 'Turner', '555-5701', 'student', 'yellow', 'active', 'Mark Turner (555-5702)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '5701'),
('u0000001-0000-0000-0000-000000000060', 'william.phillips@email.com', 'William', 'Phillips', '555-5801', 'student', 'orange', 'active', 'Helen Phillips (555-5802)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '5801'),
('u0000001-0000-0000-0000-000000000061', 'elizabeth.campbell@email.com', 'Elizabeth', 'Campbell', '555-5901', 'student', 'purple', 'active', 'James Campbell (555-5902)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '5901'),
('u0000001-0000-0000-0000-000000000062', 'david.parker@email.com', 'David', 'Parker', '555-6001', 'student', 'red', 'inactive', 'Sarah Parker (555-6002)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '6001'),
('u0000001-0000-0000-0000-000000000063', 'linda.evans@email.com', 'Linda', 'Evans', '555-6101', 'student', 'brown', 'active', 'Robert Evans (555-6102)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '6101'),
('u0000001-0000-0000-0000-000000000064', 'mark.edwards@email.com', 'Mark', 'Edwards', '555-6201', 'prospect', NULL, 'trial', 'Carol Edwards (555-6202)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '6201'),
('u0000001-0000-0000-0000-000000000065', 'michelle.collins@email.com', 'Michelle', 'Collins', '555-6301', 'student', 'green', 'active', 'Steven Collins (555-6302)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '6301'),
('u0000001-0000-0000-0000-000000000066', 'paul.stewart@email.com', 'Paul', 'Stewart', '555-6401', 'student', 'blue', 'active', 'Janet Stewart (555-6402)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '6401'),
('u0000001-0000-0000-0000-000000000067', 'nancy.sanchez@email.com', 'Nancy', 'Sanchez', '555-6501', 'student', 'yellow', 'active', 'Carlos Sanchez (555-6502)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '6501'),
('u0000001-0000-0000-0000-000000000068', 'larry.morris@email.com', 'Larry', 'Morris', '555-6601', 'student', 'orange', 'active', 'Donna Morris (555-6602)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '6601'),
('u0000001-0000-0000-0000-000000000069', 'donna.rogers@email.com', 'Donna', 'Rogers', '555-6701', 'student', 'purple', 'active', 'Michael Rogers (555-6702)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '6701'),
('u0000001-0000-0000-0000-000000000070', 'frank.reed@email.com', 'Frank', 'Reed', '555-6801', 'student', 'red', 'active', 'Betty Reed (555-6802)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '6801'),
('u0000001-0000-0000-0000-000000000071', 'angela.cook@email.com', 'Angela', 'Cook', '555-6901', 'prospect', NULL, 'trial', 'David Cook (555-6902)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '6901'),
('u0000001-0000-0000-0000-000000000072', 'scott.bailey@email.com', 'Scott', 'Bailey', '555-7001', 'student', 'brown', 'active', 'Linda Bailey (555-7002)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '7001'),
('u0000001-0000-0000-0000-000000000073', 'carol.rivera@email.com', 'Carol', 'Rivera', '555-7101', 'student', 'green', 'active', 'Miguel Rivera (555-7102)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '7101'),
('u0000001-0000-0000-0000-000000000074', 'gregory.cooper@email.com', 'Gregory', 'Cooper', '555-7201', 'student', 'blue', 'active', 'Susan Cooper (555-7202)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '7201'),
('u0000001-0000-0000-0000-000000000075', 'debra.richardson@email.com', 'Debra', 'Richardson', '555-7301', 'student', 'yellow', 'active', 'John Richardson (555-7302)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '7301'),
('u0000001-0000-0000-0000-000000000076', 'peter.cox@email.com', 'Peter', 'Cox', '555-7401', 'student', 'orange', 'active', 'Mary Cox (555-7402)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '7401'),
('u0000001-0000-0000-0000-000000000077', 'rachel.ward@email.com', 'Rachel', 'Ward', '555-7501', 'student', 'purple', 'active', 'Kevin Ward (555-7502)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '7501'),
('u0000001-0000-0000-0000-000000000078', 'harold.torres@email.com', 'Harold', 'Torres', '555-7601', 'student', 'red', 'active', 'Gloria Torres (555-7602)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '7601'),
('u0000001-0000-0000-0000-000000000079', 'carolyn.peterson@email.com', 'Carolyn', 'Peterson', '555-7701', 'prospect', NULL, 'trial', 'William Peterson (555-7702)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '7701'),
('u0000001-0000-0000-0000-000000000080', 'arthur.gray@email.com', 'Arthur', 'Gray', '555-7801', 'student', 'brown', 'active', 'Dorothy Gray (555-7802)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '7801'),
('u0000001-0000-0000-0000-000000000081', 'julie.ramirez@email.com', 'Julie', 'Ramirez', '555-7901', 'student', 'green', 'active', 'Roberto Ramirez (555-7902)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '7901'),
('u0000001-0000-0000-0000-000000000082', 'wayne.james@email.com', 'Wayne', 'James', '555-8001', 'student', 'blue', 'active', 'Patricia James (555-8002)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '8001'),
('u0000001-0000-0000-0000-000000000083', 'joyce.watson@email.com', 'Joyce', 'Watson', '555-8101', 'student', 'yellow', 'active', 'Charles Watson (555-8102)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '8101'),
('u0000001-0000-0000-0000-000000000084', 'louis.brooks@email.com', 'Louis', 'Brooks', '555-8201', 'student', 'orange', 'active', 'Helen Brooks (555-8202)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '8201'),
('u0000001-0000-0000-0000-000000000085', 'marie.kelly@email.com', 'Marie', 'Kelly', '555-8301', 'student', 'purple', 'active', 'Patrick Kelly (555-8302)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '8301'),
('u0000001-0000-0000-0000-000000000086', 'ralph.sanders@email.com', 'Ralph', 'Sanders', '555-8401', 'student', 'red', 'active', 'Barbara Sanders (555-8402)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '8401'),
('u0000001-0000-0000-0000-000000000087', 'janice.price@email.com', 'Janice', 'Price', '555-8501', 'prospect', NULL, 'trial', 'Michael Price (555-8502)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '8501'),
('u0000001-0000-0000-0000-000000000088', 'roy.bennett@email.com', 'Roy', 'Bennett', '555-8601', 'student', 'brown', 'active', 'Ruth Bennett (555-8602)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '8601'),
('u0000001-0000-0000-0000-000000000089', 'eugene.wood@email.com', 'Eugene', 'Wood', '555-8701', 'student', 'green', 'active', 'Alice Wood (555-8702)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '8701'),
('u0000001-0000-0000-0000-000000000090', 'kathryn.barnes@email.com', 'Kathryn', 'Barnes', '555-8801', 'student', 'blue', 'active', 'George Barnes (555-8802)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '8801'),
('u0000001-0000-0000-0000-000000000091', 'jimmy.ross@email.com', 'Jimmy', 'Ross', '555-8901', 'student', 'yellow', 'active', 'Sandra Ross (555-8902)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '8901'),
('u0000001-0000-0000-0000-000000000092', 'gloria.henderson@email.com', 'Gloria', 'Henderson', '555-9001', 'student', 'orange', 'active', 'Larry Henderson (555-9002)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '9001'),
('u0000001-0000-0000-0000-000000000093', 'gerald.coleman@email.com', 'Gerald', 'Coleman', '555-9101', 'student', 'purple', 'active', 'Brenda Coleman (555-9102)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '9101'),
('u0000001-0000-0000-0000-000000000094', 'teresa.jenkins@email.com', 'Teresa', 'Jenkins', '555-9201', 'student', 'red', 'active', 'Ronald Jenkins (555-9202)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '9201'),
('u0000001-0000-0000-0000-000000000095', 'phillip.perry@email.com', 'Phillip', 'Perry', '555-9301', 'student', 'brown', 'active', 'Nancy Perry (555-9302)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '9301'),
('u0000001-0000-0000-0000-000000000096', 'jean.powell@email.com', 'Jean', 'Powell', '555-9401', 'prospect', NULL, 'trial', 'Walter Powell (555-9402)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '9401'),
('u0000001-0000-0000-0000-000000000097', 'martin.long@email.com', 'Martin', 'Long', '555-9501', 'student', 'green', 'active', 'Karen Long (555-9502)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '9501'),
('u0000001-0000-0000-0000-000000000098', 'rose.hughes@email.com', 'Rose', 'Hughes', '555-9601', 'student', 'blue', 'active', 'Edward Hughes (555-9602)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '9601'),
('u0000001-0000-0000-0000-000000000099', 'albert.flores@email.com', 'Albert', 'Flores', '555-9701', 'student', 'yellow', 'active', 'Maria Flores (555-9702)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '9701'),
('u0000001-0000-0000-0000-000000000100', 'frances.washington@email.com', 'Frances', 'Washington', '555-9801', 'student', 'orange', 'active', 'James Washington (555-9802)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '9801');

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