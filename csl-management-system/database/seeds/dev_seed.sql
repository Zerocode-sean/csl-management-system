-- =====================================================
-- CSL Management System - Development Seed Data
-- IMPORTANT: These are test accounts with default password
-- Password for all test users: Admin@2025
-- DO NOT USE IN PRODUCTION
-- =====================================================

-- =====================================================
-- SEED ADMIN ACCOUNTS
-- =====================================================

-- Insert test admin accounts
-- Note: password_hash is bcrypt hash of 'Admin@2025'
INSERT INTO admins (username, email, password_hash, role, first_name, last_name, mobile, is_active) VALUES
    ('superadmin', 'superadmin@csl.com', '$2a$10$qwa/hqyZiLtxpzIiA1rM4.tbE.Vu39j.fenDl6BQMXsErQWNuTsxm', 'super_admin', 'Super', 'Admin', '+1234567890', true),
    ('admin', 'admin@csl.com', '$2a$10$qwa/hqyZiLtxpzIiA1rM4.tbE.Vu39j.fenDl6BQMXsErQWNuTsxm', 'admin', 'Regular', 'Admin', '+1234567891', true),
    ('coursemanager', 'manager@csl.com', '$2a$10$qwa/hqyZiLtxpzIiA1rM4.tbE.Vu39j.fenDl6BQMXsErQWNuTsxm', 'course_manager', 'Course', 'Manager', '+1234567892', true)
ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- SEED COURSES
-- =====================================================

INSERT INTO courses (code, title, description, duration_months, is_active) VALUES
    ('CS', 'Computer Science Fundamentals', 'Comprehensive introduction to computer science principles and programming', 6, true),
    ('WD', 'Web Development', 'Full-stack web development with modern frameworks and tools', 4, true),
    ('DS', 'Data Science', 'Data analysis, machine learning, and statistical modeling', 8, true),
    ('CY', 'Cybersecurity', 'Network security, ethical hacking, and information security', 6, true),
    ('AI', 'Artificial Intelligence', 'Machine learning, deep learning, and AI applications', 10, true),
    ('DB', 'Database Administration', 'Database design, SQL, and database management systems', 5, true),
    ('PM', 'Project Management', 'Agile methodologies, project planning, and team leadership', 3, true),
    ('UI', 'UI/UX Design', 'User interface design, user experience, and design thinking', 4, true),
    ('MB', 'Mobile App Development', 'iOS and Android app development with React Native', 6, true),
    ('CC', 'Cloud Computing', 'AWS, Azure, Docker, and cloud infrastructure management', 5, true)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- SEED STUDENTS
-- =====================================================

INSERT INTO students (student_custom_id, name, email, mobile, address, date_of_birth) VALUES
    ('CSL-2024-001', 'John Doe', 'john.doe@email.com', '+1234567801', '123 Main St, City, State 12345', '1995-05-15'),
    ('CSL-2024-002', 'Jane Smith', 'jane.smith@email.com', '+1234567802', '456 Oak Ave, City, State 12346', '1992-08-22'),
    ('CSL-2024-003', 'Michael Johnson', 'michael.j@email.com', '+1234567803', '789 Pine Rd, City, State 12347', '1998-03-10'),
    ('CSL-2024-004', 'Emily Brown', 'emily.brown@email.com', '+1234567804', '321 Elm St, City, State 12348', '1994-11-30'),
    ('CSL-2024-005', 'David Wilson', 'david.w@email.com', '+1234567805', '654 Maple Dr, City, State 12349', '1996-07-18'),
    ('CSL-2024-006', 'Sarah Davis', 'sarah.davis@email.com', '+1234567806', '987 Cedar Ln, City, State 12350', '1993-02-25'),
    ('CSL-2024-007', 'Robert Martinez', 'robert.m@email.com', '+1234567807', '147 Birch Ct, City, State 12351', '1997-09-12'),
    ('CSL-2024-008', 'Lisa Anderson', 'lisa.a@email.com', '+1234567808', '258 Spruce Way, City, State 12352', '1991-12-05'),
    ('CSL-2024-009', 'James Taylor', 'james.t@email.com', '+1234567809', '369 Willow Pl, City, State 12353', '1999-01-20'),
    ('CSL-2024-010', 'Jennifer Thomas', 'jennifer.t@email.com', '+1234567810', '741 Ash Blvd, City, State 12354', '1990-06-08'),
    ('CSL-2024-011', 'William Garcia', 'william.g@email.com', '+1234567811', '852 Poplar St, City, State 12355', '1995-04-14'),
    ('CSL-2024-012', 'Mary Rodriguez', 'mary.r@email.com', '+1234567812', '963 Hickory Ave, City, State 12356', '1994-10-27'),
    ('CSL-2024-013', 'Christopher Lee', 'chris.lee@email.com', '+1234567813', '159 Walnut Dr, City, State 12357', '1996-08-19'),
    ('CSL-2024-014', 'Patricia White', 'patricia.w@email.com', '+1234567814', '357 Cherry Rd, City, State 12358', '1992-03-16'),
    ('CSL-2024-015', 'Daniel Harris', 'daniel.h@email.com', '+1234567815', '468 Pecan Ln, City, State 12359', '1998-11-22')
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- SEED SAMPLE CERTIFICATES
-- =====================================================

-- Note: In production, these would be generated through the application
-- These are examples only with placeholder verification hashes

INSERT INTO certificates (
    csl_number, 
    student_id, 
    course_id, 
    issued_by_admin_id, 
    issue_date, 
    status, 
    notes
)
SELECT 
    '2024-CS-' || LPAD(ROW_NUMBER() OVER (ORDER BY s.student_id)::TEXT, 4, '0') || '-ABC123',
    s.student_id,
    c.course_id,
    1, -- superadmin
    CURRENT_DATE - (RANDOM() * 365)::INT,
    'active',
    'Sample certificate for testing'
FROM students s
CROSS JOIN courses c
WHERE c.code = 'CS'
LIMIT 5
ON CONFLICT (csl_number) DO NOTHING;

INSERT INTO certificates (
    csl_number, 
    student_id, 
    course_id, 
    issued_by_admin_id, 
    issue_date, 
    status, 
    notes
)
SELECT 
    '2024-WD-' || LPAD(ROW_NUMBER() OVER (ORDER BY s.student_id)::TEXT, 4, '0') || '-DEF456',
    s.student_id,
    c.course_id,
    2, -- admin
    CURRENT_DATE - (RANDOM() * 365)::INT,
    'active',
    'Sample certificate for testing'
FROM students s
CROSS JOIN courses c
WHERE c.code = 'WD'
LIMIT 5
ON CONFLICT (csl_number) DO NOTHING;

-- Insert one revoked certificate for testing
INSERT INTO certificates (
    csl_number, 
    student_id, 
    course_id, 
    issued_by_admin_id, 
    issue_date, 
    status,
    revoked_at,
    revoked_by_admin_id,
    revocation_reason,
    notes
)
SELECT 
    '2023-DS-0001-XYZ789',
    s.student_id,
    c.course_id,
    1,
    '2023-06-15',
    'revoked',
    '2024-01-10',
    1,
    'Certificate issued in error - student did not complete final exam',
    'Revoked certificate for testing'
FROM students s
CROSS JOIN courses c
WHERE c.code = 'DS' AND s.email = 'john.doe@email.com'
LIMIT 1
ON CONFLICT (csl_number) DO NOTHING;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify seed data
DO $$
DECLARE
    admin_count INT;
    student_count INT;
    course_count INT;
    cert_count INT;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM admins;
    SELECT COUNT(*) INTO student_count FROM students;
    SELECT COUNT(*) INTO course_count FROM courses;
    SELECT COUNT(*) INTO cert_count FROM certificates;
    
    RAISE NOTICE '===== Seed Data Summary =====';
    RAISE NOTICE 'Admins: %', admin_count;
    RAISE NOTICE 'Students: %', student_count;
    RAISE NOTICE 'Courses: %', course_count;
    RAISE NOTICE 'Certificates: %', cert_count;
    RAISE NOTICE '============================';
    RAISE NOTICE 'Test Admin Credentials:';
    RAISE NOTICE 'Username: superadmin | Email: superadmin@csl.com | Password: Admin@2025';
    RAISE NOTICE 'Username: admin | Email: admin@csl.com | Password: Admin@2025';
    RAISE NOTICE 'Username: coursemanager | Email: manager@csl.com | Password: Admin@2025';
    RAISE NOTICE '============================';
END $$;
