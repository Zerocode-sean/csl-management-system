-- CSL Management System Database Schema
-- Version 2.0 - Enhanced with repositories and services

-- Enable UUID extension for PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS student_status CASCADE;
DROP TYPE IF EXISTS certificate_status CASCADE;
DROP TYPE IF EXISTS enrollment_status CASCADE;

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'instructor', 'student', 'viewer');
CREATE TYPE student_status AS ENUM ('active', 'graduated', 'suspended', 'withdrawn');
CREATE TYPE certificate_status AS ENUM ('active', 'revoked', 'suspended', 'expired');
CREATE TYPE enrollment_status AS ENUM ('enrolled', 'in_progress', 'completed', 'dropped', 'failed');

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role DEFAULT 'student',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Students table
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    address TEXT,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    graduation_date DATE,
    status student_status DEFAULT 'active',
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    description TEXT,
    credits INTEGER NOT NULL DEFAULT 1,
    duration_hours INTEGER NOT NULL DEFAULT 40,
    instructor_id INTEGER REFERENCES users(id),
    category VARCHAR(100) NOT NULL,
    prerequisites TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enrollments table (relationship between students and courses)
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    completion_date DATE,
    status enrollment_status DEFAULT 'enrolled',
    grade VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id)
);

-- Certificates table
CREATE TABLE certificates (
    id SERIAL PRIMARY KEY,
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    csl_number VARCHAR(50) UNIQUE NOT NULL,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    issue_date DATE DEFAULT CURRENT_DATE,
    completion_date DATE NOT NULL,
    grade VARCHAR(10),
    gpa DECIMAL(3,2) CHECK (gpa >= 0 AND gpa <= 4.0),
    status certificate_status DEFAULT 'active',
    issued_by INTEGER NOT NULL REFERENCES users(id),
    verification_hash VARCHAR(255) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id)
);

-- Audit logs table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_enrollment_date ON students(enrollment_date);

CREATE INDEX idx_courses_course_code ON courses(course_code);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_is_active ON courses(is_active);

CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);

CREATE INDEX idx_certificates_csl_number ON certificates(csl_number);
CREATE INDEX idx_certificates_student_id ON certificates(student_id);
CREATE INDEX idx_certificates_course_id ON certificates(course_id);
CREATE INDEX idx_certificates_status ON certificates(status);
CREATE INDEX idx_certificates_issue_date ON certificates(issue_date);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at 
    BEFORE UPDATE ON students 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at 
    BEFORE UPDATE ON courses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at 
    BEFORE UPDATE ON enrollments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at 
    BEFORE UPDATE ON certificates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO users (username, email, password_hash, first_name, last_name, role) VALUES
('admin', 'admin@csl.emesa.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewUnGQDqQqFYTfLy', 'System', 'Administrator', 'admin'),
('instructor1', 'instructor@csl.emesa.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewUnGQDqQqFYTfLy', 'John', 'Instructor', 'instructor');

INSERT INTO courses (course_code, course_name, description, credits, duration_hours, category) VALUES
('CS101', 'Introduction to Computer Science', 'Basic concepts of computer science and programming', 3, 120, 'Computer Science'),
('WEB201', 'Web Development Fundamentals', 'HTML, CSS, JavaScript basics', 4, 160, 'Web Development'),
('DATA301', 'Data Analysis', 'Statistical analysis and data visualization', 3, 100, 'Data Science');

INSERT INTO students (student_id, first_name, last_name, email, enrollment_date) VALUES
('CSL2025001', 'Alice', 'Johnson', 'alice.johnson@student.emesa.edu', '2025-01-15'),
('CSL2025002', 'Bob', 'Smith', 'bob.smith@student.emesa.edu', '2025-01-15'),
('CSL2025003', 'Carol', 'Davis', 'carol.davis@student.emesa.edu', '2025-02-01');

-- Sample enrollments
INSERT INTO enrollments (student_id, course_id, status) VALUES
((SELECT id FROM students WHERE student_id = 'CSL2025001'), (SELECT id FROM courses WHERE course_code = 'CS101'), 'completed'),
((SELECT id FROM students WHERE student_id = 'CSL2025002'), (SELECT id FROM courses WHERE course_code = 'WEB201'), 'in_progress'),
((SELECT id FROM students WHERE student_id = 'CSL2025003'), (SELECT id FROM courses WHERE course_code = 'DATA301'), 'enrolled');

-- Sample certificate (for completed enrollment)
INSERT INTO certificates (
    certificate_number, 
    csl_number, 
    student_id, 
    course_id, 
    completion_date, 
    grade, 
    gpa,
    issued_by, 
    verification_hash
) VALUES (
    'CERT-2025-001',
    'CSL-2025-ABC123',
    (SELECT id FROM students WHERE student_id = 'CSL2025001'),
    (SELECT id FROM courses WHERE course_code = 'CS101'),
    '2025-03-15',
    'A',
    3.8,
    (SELECT id FROM users WHERE username = 'admin'),
    'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456'
);

-- Verify schema creation
SELECT 'Database schema created successfully!' as status;
