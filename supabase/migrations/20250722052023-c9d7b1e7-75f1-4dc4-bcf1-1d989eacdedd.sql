-- Create 100 mock contacts with properly formatted UUIDs
INSERT INTO public.profiles (
  id, email, first_name, last_name, phone, role, belt_level, membership_status,
  emergency_contact, academy_id, check_in_pin
) VALUES 
-- Family 1: The Johnson Family (Parents and Children)
('11111111-1111-1111-1111-111111111001', 'mike.johnson@email.com', 'Mike', 'Johnson', '555-0101', 'parent', NULL, 'active', 'Sarah Johnson (555-0102)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1001'),
('11111111-1111-1111-1111-111111111002', 'sarah.johnson@email.com', 'Sarah', 'Johnson', '555-0102', 'parent', NULL, 'active', 'Mike Johnson (555-0101)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1002'),
('11111111-1111-1111-1111-111111111003', 'emma.johnson@email.com', 'Emma', 'Johnson', '555-0103', 'student', 'white', 'active', 'Mike Johnson (555-0101)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1003'),
('11111111-1111-1111-1111-111111111004', 'lucas.johnson@email.com', 'Lucas', 'Johnson', '555-0104', 'student', 'yellow', 'active', 'Mike Johnson (555-0101)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1004'),

-- Family 2: The Rodriguez Family
('22222222-2222-2222-2222-222222222001', 'carlos.rodriguez@email.com', 'Carlos', 'Rodriguez', '555-0201', 'parent', 'black_1st_dan', 'active', 'Maria Rodriguez (555-0202)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '2001'),
('22222222-2222-2222-2222-222222222002', 'maria.rodriguez@email.com', 'Maria', 'Rodriguez', '555-0202', 'parent', NULL, 'active', 'Carlos Rodriguez (555-0201)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '2002'),
('22222222-2222-2222-2222-222222222003', 'sofia.rodriguez@email.com', 'Sofia', 'Rodriguez', '555-0203', 'student', 'green', 'active', 'Carlos Rodriguez (555-0201)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '2003'),

-- Family 3: The Chen Family  
('33333333-3333-3333-3333-333333333001', 'david.chen@email.com', 'David', 'Chen', '555-0301', 'parent', NULL, 'active', 'Lisa Chen (555-0302)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3001'),
('33333333-3333-3333-3333-333333333002', 'lisa.chen@email.com', 'Lisa', 'Chen', '555-0302', 'parent', NULL, 'active', 'David Chen (555-0301)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3002'),
('33333333-3333-3333-3333-333333333003', 'kevin.chen@email.com', 'Kevin', 'Chen', '555-0303', 'student', 'blue', 'active', 'David Chen (555-0301)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3003'),
('33333333-3333-3333-3333-333333333004', 'amy.chen@email.com', 'Amy', 'Chen', '555-0304', 'student', 'orange', 'active', 'David Chen (555-0301)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3004'),

-- Individual Students (Adult)
('44444444-4444-4444-4444-444444444001', 'james.wilson@email.com', 'James', 'Wilson', '555-0401', 'student', 'brown', 'active', 'Emily Wilson (555-0402)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '4001'),
('44444444-4444-4444-4444-444444444002', 'ashley.davis@email.com', 'Ashley', 'Davis', '555-0501', 'student', 'purple', 'active', 'Michael Davis (555-0502)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '5001'),
('44444444-4444-4444-4444-444444444003', 'michael.thompson@email.com', 'Michael', 'Thompson', '555-0601', 'student', 'red', 'active', 'Jennifer Thompson (555-0602)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '6001'),
('44444444-4444-4444-4444-444444444004', 'jessica.martinez@email.com', 'Jessica', 'Martinez', '555-0701', 'student', 'black_1st_dan', 'active', 'Roberto Martinez (555-0702)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '7001'),
('44444444-4444-4444-4444-444444444005', 'robert.taylor@email.com', 'Robert', 'Taylor', '555-0801', 'student', 'black_2nd_dan', 'active', 'Linda Taylor (555-0802)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '8001'),

-- Instructors and Staff
('55555555-5555-5555-5555-555555555001', 'sensei.kim@email.com', 'Master', 'Kim', '555-0901', 'instructor', 'black_5th_dan', 'active', 'Susan Kim (555-0902)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '9001'),
('55555555-5555-5555-5555-555555555002', 'instructor.brown@email.com', 'Sarah', 'Brown', '555-1001', 'instructor', 'black_3rd_dan', 'active', 'Mark Brown (555-1002)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '0001'),
('55555555-5555-5555-5555-555555555003', 'assistant.lee@email.com', 'Daniel', 'Lee', '555-1101', 'instructor', 'black_2nd_dan', 'active', 'Grace Lee (555-1102)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1101'),

-- Prospects and Trial Members
('66666666-6666-6666-6666-666666666001', 'prospect.smith@email.com', 'John', 'Smith', '555-1201', 'prospect', NULL, 'trial', 'Jane Smith (555-1202)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1201'),
('66666666-6666-6666-6666-666666666002', 'trial.williams@email.com', 'Emma', 'Williams', '555-1301', 'prospect', NULL, 'trial', 'Tom Williams (555-1302)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1301'),

-- Inactive/Former Members
('77777777-7777-7777-7777-777777777001', 'former.garcia@email.com', 'Alex', 'Garcia', '555-1401', 'student', 'green', 'inactive', 'Rosa Garcia (555-1402)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1401'),
('77777777-7777-7777-7777-777777777002', 'paused.jones@email.com', 'Megan', 'Jones', '555-1501', 'student', 'blue', 'paused', 'Steve Jones (555-1502)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1501'),

-- Family 4: The Patel Family
('88888888-8888-8888-8888-888888888001', 'raj.patel@email.com', 'Raj', 'Patel', '555-1801', 'parent', NULL, 'active', 'Priya Patel (555-1802)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1801'),
('88888888-8888-8888-8888-888888888002', 'priya.patel@email.com', 'Priya', 'Patel', '555-1802', 'parent', NULL, 'active', 'Raj Patel (555-1801)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1802'),
('88888888-8888-8888-8888-888888888003', 'arjun.patel@email.com', 'Arjun', 'Patel', '555-1803', 'student', 'yellow', 'active', 'Raj Patel (555-1801)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1803'),
('88888888-8888-8888-8888-888888888004', 'maya.patel@email.com', 'Maya', 'Patel', '555-1804', 'student', 'white', 'active', 'Raj Patel (555-1801)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1804'),

-- Continue with remaining contacts using properly formatted UUIDs...
('99999999-9999-9999-9999-999999999001', 'teen.cooper@email.com', 'Tyler', 'Cooper', '555-1601', 'student', 'orange', 'active', 'Rachel Cooper (555-1602)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1601'),
('99999999-9999-9999-9999-999999999002', 'adult.morgan@email.com', 'Patricia', 'Morgan', '555-1701', 'student', 'white', 'active', 'William Morgan (555-1702)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1701'),
('99999999-9999-9999-9999-999999999003', 'athlete.jackson@email.com', 'Marcus', 'Jackson', '555-1901', 'student', 'red', 'active', 'Denise Jackson (555-1902)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '1901'),
('99999999-9999-9999-9999-999999999004', 'fitness.white@email.com', 'Amanda', 'White', '555-2001', 'student', 'purple', 'active', 'Brian White (555-2002)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '2001'),
('99999999-9999-9999-9999-999999999005', 'business.adams@email.com', 'Richard', 'Adams', '555-2101', 'student', 'brown', 'active', 'Susan Adams (555-2102)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '2101'),

-- Continue with 70 more diverse contacts to reach 100
('a0000001-0000-0000-0000-000000000001', 'linda.martinez@email.com', 'Linda', 'Martinez', '555-2301', 'student', 'green', 'active', 'Carlos Martinez (555-2302)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '2301'),
('a0000001-0000-0000-0000-000000000002', 'robert.clark@email.com', 'Robert', 'Clark', '555-2401', 'student', 'blue', 'active', 'Helen Clark (555-2402)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '2401'),
('a0000001-0000-0000-0000-000000000003', 'nancy.lewis@email.com', 'Nancy', 'Lewis', '555-2501', 'student', 'yellow', 'active', 'Paul Lewis (555-2502)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '2501'),
('a0000001-0000-0000-0000-000000000004', 'kevin.wright@email.com', 'Kevin', 'Wright', '555-2601', 'student', 'orange', 'active', 'Sandra Wright (555-2602)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '2601'),
('a0000001-0000-0000-0000-000000000005', 'carol.hall@email.com', 'Carol', 'Hall', '555-2701', 'student', 'purple', 'active', 'John Hall (555-2702)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '2701'),
('a0000001-0000-0000-0000-000000000006', 'steve.allen@email.com', 'Steve', 'Allen', '555-2801', 'student', 'red', 'active', 'Mary Allen (555-2802)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '2801'),
('a0000001-0000-0000-0000-000000000007', 'diane.young@email.com', 'Diane', 'Young', '555-2901', 'prospect', NULL, 'trial', 'Tom Young (555-2902)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '2901'),
('a0000001-0000-0000-0000-000000000008', 'paul.king@email.com', 'Paul', 'King', '555-3001', 'student', 'brown', 'active', 'Lisa King (555-3002)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3001'),
('a0000001-0000-0000-0000-000000000009', 'janet.scott@email.com', 'Janet', 'Scott', '555-3101', 'student', 'green', 'active', 'Mark Scott (555-3102)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3101'),
('a0000001-0000-0000-0000-000000000010', 'brian.adams@email.com', 'Brian', 'Adams', '555-3201', 'student', 'blue', 'active', 'Susan Adams (555-3202)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3201'),
('a0000001-0000-0000-0000-000000000011', 'helen.baker@email.com', 'Helen', 'Baker', '555-3301', 'student', 'yellow', 'active', 'Robert Baker (555-3302)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3301'),
('a0000001-0000-0000-0000-000000000012', 'frank.green@email.com', 'Frank', 'Green', '555-3401', 'student', 'orange', 'active', 'Carol Green (555-3402)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3401'),
('a0000001-0000-0000-0000-000000000013', 'ruth.parker@email.com', 'Ruth', 'Parker', '555-3501', 'student', 'purple', 'active', 'James Parker (555-3502)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3501'),
('a0000001-0000-0000-0000-000000000014', 'gary.evans@email.com', 'Gary', 'Evans', '555-3601', 'student', 'red', 'active', 'Linda Evans (555-3602)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3601'),
('a0000001-0000-0000-0000-000000000015', 'betty.turner@email.com', 'Betty', 'Turner', '555-3701', 'student', 'brown', 'active', 'William Turner (555-3702)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3701'),
('a0000001-0000-0000-0000-000000000016', 'donald.phillips@email.com', 'Donald', 'Phillips', '555-3801', 'student', 'green', 'active', 'Mary Phillips (555-3802)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3801'),
('a0000001-0000-0000-0000-000000000017', 'dorothy.campbell@email.com', 'Dorothy', 'Campbell', '555-3901', 'prospect', NULL, 'trial', 'Robert Campbell (555-3902)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '3901'),
('a0000001-0000-0000-0000-000000000018', 'kenneth.mitchell@email.com', 'Kenneth', 'Mitchell', '555-4001', 'student', 'blue', 'active', 'Patricia Mitchell (555-4002)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '4001'),
('a0000001-0000-0000-0000-000000000019', 'lisa.roberts@email.com', 'Lisa', 'Roberts', '555-4101', 'student', 'yellow', 'active', 'David Roberts (555-4102)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '4101'),
('a0000001-0000-0000-0000-000000000020', 'anthony.carter@email.com', 'Anthony', 'Carter', '555-4201', 'student', 'orange', 'active', 'Michelle Carter (555-4202)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '4201'),
('a0000001-0000-0000-0000-000000000021', 'sandra.garcia@email.com', 'Sandra', 'Garcia', '555-4301', 'student', 'purple', 'active', 'Carlos Garcia (555-4302)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '4301'),
('a0000001-0000-0000-0000-000000000022', 'charles.martinez@email.com', 'Charles', 'Martinez', '555-4401', 'student', 'red', 'active', 'Rosa Martinez (555-4402)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '4401'),
('a0000001-0000-0000-0000-000000000023', 'karen.rodriguez@email.com', 'Karen', 'Rodriguez', '555-4501', 'student', 'brown', 'active', 'Miguel Rodriguez (555-4502)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '4501'),
('a0000001-0000-0000-0000-000000000024', 'christopher.lopez@email.com', 'Christopher', 'Lopez', '555-4601', 'student', 'green', 'active', 'Maria Lopez (555-4602)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '4601'),
('a0000001-0000-0000-0000-000000000025', 'deborah.lee@email.com', 'Deborah', 'Lee', '555-4701', 'prospect', NULL, 'trial', 'John Lee (555-4702)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '4701'),
('a0000001-0000-0000-0000-000000000026', 'matthew.walker@email.com', 'Matthew', 'Walker', '555-4801', 'student', 'blue', 'active', 'Jennifer Walker (555-4802)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '4801'),
('a0000001-0000-0000-0000-000000000027', 'patricia.hall@email.com', 'Patricia', 'Hall', '555-4901', 'student', 'yellow', 'active', 'Michael Hall (555-4902)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '4901'),
('a0000001-0000-0000-0000-000000000028', 'daniel.allen@email.com', 'Daniel', 'Allen', '555-5001', 'student', 'orange', 'active', 'Susan Allen (555-5002)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '5001'),
('a0000001-0000-0000-0000-000000000029', 'barbara.young@email.com', 'Barbara', 'Young', '555-5101', 'student', 'purple', 'paused', 'Thomas Young (555-5102)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '5101'),
('a0000001-0000-0000-0000-000000000030', 'joseph.hernandez@email.com', 'Joseph', 'Hernandez', '555-5201', 'student', 'red', 'active', 'Carmen Hernandez (555-5202)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '5201'),
('a0000001-0000-0000-0000-000000000031', 'susan.nelson@email.com', 'Susan', 'Nelson', '555-5301', 'student', 'brown', 'active', 'Robert Nelson (555-5302)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '5301'),
('a0000001-0000-0000-0000-000000000032', 'thomas.carter@email.com', 'Thomas', 'Carter', '555-5401', 'prospect', NULL, 'trial', 'Lisa Carter (555-5402)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '5401'),
('a0000001-0000-0000-0000-000000000033', 'mary.perez@email.com', 'Mary', 'Perez', '555-5501', 'student', 'green', 'active', 'Juan Perez (555-5502)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '5501'),
('a0000001-0000-0000-0000-000000000034', 'richard.roberts@email.com', 'Richard', 'Roberts', '555-5601', 'student', 'blue', 'active', 'Nancy Roberts (555-5602)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '5601'),
('a0000001-0000-0000-0000-000000000035', 'jennifer.turner@email.com', 'Jennifer', 'Turner', '555-5701', 'student', 'yellow', 'active', 'Mark Turner (555-5702)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '5701'),
('a0000001-0000-0000-0000-000000000036', 'william.phillips@email.com', 'William', 'Phillips', '555-5801', 'student', 'orange', 'active', 'Helen Phillips (555-5802)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '5801'),
('a0000001-0000-0000-0000-000000000037', 'elizabeth.campbell@email.com', 'Elizabeth', 'Campbell', '555-5901', 'student', 'purple', 'active', 'James Campbell (555-5902)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '5901'),
('a0000001-0000-0000-0000-000000000038', 'david.parker@email.com', 'David', 'Parker', '555-6001', 'student', 'red', 'inactive', 'Sarah Parker (555-6002)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '6001'),
('a0000001-0000-0000-0000-000000000039', 'linda.evans@email.com', 'Linda', 'Evans', '555-6101', 'student', 'brown', 'active', 'Robert Evans (555-6102)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '6101'),
('a0000001-0000-0000-0000-000000000040', 'mark.edwards@email.com', 'Mark', 'Edwards', '555-6201', 'prospect', NULL, 'trial', 'Carol Edwards (555-6202)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '6201'),
('a0000001-0000-0000-0000-000000000041', 'michelle.collins@email.com', 'Michelle', 'Collins', '555-6301', 'student', 'green', 'active', 'Steven Collins (555-6302)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '6301'),
('a0000001-0000-0000-0000-000000000042', 'paul.stewart@email.com', 'Paul', 'Stewart', '555-6401', 'student', 'blue', 'active', 'Janet Stewart (555-6402)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '6401'),
('a0000001-0000-0000-0000-000000000043', 'nancy.sanchez@email.com', 'Nancy', 'Sanchez', '555-6501', 'student', 'yellow', 'active', 'Carlos Sanchez (555-6502)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '6501'),
('a0000001-0000-0000-0000-000000000044', 'larry.morris@email.com', 'Larry', 'Morris', '555-6601', 'student', 'orange', 'active', 'Donna Morris (555-6602)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '6601'),
('a0000001-0000-0000-0000-000000000045', 'donna.rogers@email.com', 'Donna', 'Rogers', '555-6701', 'student', 'purple', 'active', 'Michael Rogers (555-6702)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '6701'),
('a0000001-0000-0000-0000-000000000046', 'frank.reed@email.com', 'Frank', 'Reed', '555-6801', 'student', 'red', 'active', 'Betty Reed (555-6802)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '6801'),
('a0000001-0000-0000-0000-000000000047', 'angela.cook@email.com', 'Angela', 'Cook', '555-6901', 'prospect', NULL, 'trial', 'David Cook (555-6902)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '6901'),
('a0000001-0000-0000-0000-000000000048', 'scott.bailey@email.com', 'Scott', 'Bailey', '555-7001', 'student', 'brown', 'active', 'Linda Bailey (555-7002)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '7001'),
('a0000001-0000-0000-0000-000000000049', 'carol.rivera@email.com', 'Carol', 'Rivera', '555-7101', 'student', 'green', 'active', 'Miguel Rivera (555-7102)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '7101'),
('a0000001-0000-0000-0000-000000000050', 'gregory.cooper@email.com', 'Gregory', 'Cooper', '555-7201', 'student', 'blue', 'active', 'Susan Cooper (555-7202)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '7201'),
('a0000001-0000-0000-0000-000000000051', 'debra.richardson@email.com', 'Debra', 'Richardson', '555-7301', 'student', 'yellow', 'active', 'John Richardson (555-7302)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '7301'),
('a0000001-0000-0000-0000-000000000052', 'peter.cox@email.com', 'Peter', 'Cox', '555-7401', 'student', 'orange', 'active', 'Mary Cox (555-7402)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '7401'),
('a0000001-0000-0000-0000-000000000053', 'rachel.ward@email.com', 'Rachel', 'Ward', '555-7501', 'student', 'purple', 'active', 'Kevin Ward (555-7502)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '7501'),
('a0000001-0000-0000-0000-000000000054', 'harold.torres@email.com', 'Harold', 'Torres', '555-7601', 'student', 'red', 'active', 'Gloria Torres (555-7602)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '7601'),
('a0000001-0000-0000-0000-000000000055', 'carolyn.peterson@email.com', 'Carolyn', 'Peterson', '555-7701', 'prospect', NULL, 'trial', 'William Peterson (555-7702)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '7701'),
('a0000001-0000-0000-0000-000000000056', 'arthur.gray@email.com', 'Arthur', 'Gray', '555-7801', 'student', 'brown', 'active', 'Dorothy Gray (555-7802)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '7801'),
('a0000001-0000-0000-0000-000000000057', 'julie.ramirez@email.com', 'Julie', 'Ramirez', '555-7901', 'student', 'green', 'active', 'Roberto Ramirez (555-7902)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '7901'),
('a0000001-0000-0000-0000-000000000058', 'wayne.james@email.com', 'Wayne', 'James', '555-8001', 'student', 'blue', 'active', 'Patricia James (555-8002)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '8001'),
('a0000001-0000-0000-0000-000000000059', 'joyce.watson@email.com', 'Joyce', 'Watson', '555-8101', 'student', 'yellow', 'active', 'Charles Watson (555-8102)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '8101'),
('a0000001-0000-0000-0000-000000000060', 'louis.brooks@email.com', 'Louis', 'Brooks', '555-8201', 'student', 'orange', 'active', 'Helen Brooks (555-8202)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '8201'),
('a0000001-0000-0000-0000-000000000061', 'marie.kelly@email.com', 'Marie', 'Kelly', '555-8301', 'student', 'purple', 'active', 'Patrick Kelly (555-8302)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '8301'),
('a0000001-0000-0000-0000-000000000062', 'ralph.sanders@email.com', 'Ralph', 'Sanders', '555-8401', 'student', 'red', 'active', 'Barbara Sanders (555-8402)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '8401'),
('a0000001-0000-0000-0000-000000000063', 'janice.price@email.com', 'Janice', 'Price', '555-8501', 'prospect', NULL, 'trial', 'Michael Price (555-8502)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '8501'),
('a0000001-0000-0000-0000-000000000064', 'roy.bennett@email.com', 'Roy', 'Bennett', '555-8601', 'student', 'brown', 'active', 'Ruth Bennett (555-8602)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '8601'),
('a0000001-0000-0000-0000-000000000065', 'eugene.wood@email.com', 'Eugene', 'Wood', '555-8701', 'student', 'green', 'active', 'Alice Wood (555-8702)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '8701'),
('a0000001-0000-0000-0000-000000000066', 'kathryn.barnes@email.com', 'Kathryn', 'Barnes', '555-8801', 'student', 'blue', 'active', 'George Barnes (555-8802)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '8801'),
('a0000001-0000-0000-0000-000000000067', 'jimmy.ross@email.com', 'Jimmy', 'Ross', '555-8901', 'student', 'yellow', 'active', 'Sandra Ross (555-8902)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '8901'),
('a0000001-0000-0000-0000-000000000068', 'gloria.henderson@email.com', 'Gloria', 'Henderson', '555-9001', 'student', 'orange', 'active', 'Larry Henderson (555-9002)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '9001'),
('a0000001-0000-0000-0000-000000000069', 'gerald.coleman@email.com', 'Gerald', 'Coleman', '555-9101', 'student', 'purple', 'active', 'Brenda Coleman (555-9102)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '9101'),
('a0000001-0000-0000-0000-000000000070', 'teresa.jenkins@email.com', 'Teresa', 'Jenkins', '555-9201', 'student', 'red', 'active', 'Ronald Jenkins (555-9202)', '90b44e8b-c33a-4a98-bc3c-e9a18f434630', '9201');

-- Create family relationships for the major families
INSERT INTO public.family_relationships (primary_contact_id, related_contact_id, relationship_type, is_emergency_contact, notes) VALUES
-- Johnson Family relationships
('11111111-1111-1111-1111-111111111001', '11111111-1111-1111-1111-111111111002', 'spouse', true, 'Married couple'),
('11111111-1111-1111-1111-111111111002', '11111111-1111-1111-1111-111111111001', 'spouse', true, 'Married couple'),
('11111111-1111-1111-1111-111111111001', '11111111-1111-1111-1111-111111111003', 'parent', true, 'Father-daughter'),
('11111111-1111-1111-1111-111111111001', '11111111-1111-1111-1111-111111111004', 'parent', true, 'Father-son'),
('11111111-1111-1111-1111-111111111002', '11111111-1111-1111-1111-111111111003', 'parent', true, 'Mother-daughter'),
('11111111-1111-1111-1111-111111111002', '11111111-1111-1111-1111-111111111004', 'parent', true, 'Mother-son'),
('11111111-1111-1111-1111-111111111003', '11111111-1111-1111-1111-111111111004', 'sibling', false, 'Sister-brother'),

-- Rodriguez Family relationships
('22222222-2222-2222-2222-222222222001', '22222222-2222-2222-2222-222222222002', 'spouse', true, 'Married couple'),
('22222222-2222-2222-2222-222222222002', '22222222-2222-2222-2222-222222222001', 'spouse', true, 'Married couple'),
('22222222-2222-2222-2222-222222222001', '22222222-2222-2222-2222-222222222003', 'parent', true, 'Father-daughter'),
('22222222-2222-2222-2222-222222222002', '22222222-2222-2222-2222-222222222003', 'parent', true, 'Mother-daughter'),

-- Chen Family relationships
('33333333-3333-3333-3333-333333333001', '33333333-3333-3333-3333-333333333002', 'spouse', true, 'Married couple'),
('33333333-3333-3333-3333-333333333002', '33333333-3333-3333-3333-333333333001', 'spouse', true, 'Married couple'),
('33333333-3333-3333-3333-333333333001', '33333333-3333-3333-3333-333333333003', 'parent', true, 'Father-son'),
('33333333-3333-3333-3333-333333333001', '33333333-3333-3333-3333-333333333004', 'parent', true, 'Father-daughter'),
('33333333-3333-3333-3333-333333333002', '33333333-3333-3333-3333-333333333003', 'parent', true, 'Mother-son'),
('33333333-3333-3333-3333-333333333002', '33333333-3333-3333-3333-333333333004', 'parent', true, 'Mother-daughter'),
('33333333-3333-3333-3333-333333333003', '33333333-3333-3333-3333-333333333004', 'sibling', false, 'Brother-sister'),

-- Patel Family relationships
('88888888-8888-8888-8888-888888888001', '88888888-8888-8888-8888-888888888002', 'spouse', true, 'Married couple'),
('88888888-8888-8888-8888-888888888002', '88888888-8888-8888-8888-888888888001', 'spouse', true, 'Married couple'),
('88888888-8888-8888-8888-888888888001', '88888888-8888-8888-8888-888888888003', 'parent', true, 'Father-son'),
('88888888-8888-8888-8888-888888888001', '88888888-8888-8888-8888-888888888004', 'parent', true, 'Father-daughter'),
('88888888-8888-8888-8888-888888888002', '88888888-8888-8888-8888-888888888003', 'parent', true, 'Mother-son'),
('88888888-8888-8888-8888-888888888002', '88888888-8888-8888-8888-888888888004', 'parent', true, 'Mother-daughter'),
('88888888-8888-8888-8888-888888888003', '88888888-8888-8888-8888-888888888004', 'sibling', false, 'Brother-sister');

-- Create academy memberships for all contacts
INSERT INTO public.academy_memberships (user_id, academy_id, role, is_active) 
SELECT id, academy_id, role, (membership_status = 'active')
FROM public.profiles 
WHERE academy_id = '90b44e8b-c33a-4a98-bc3c-e9a18f434630';