 -- =====================================================
-- CSL Management System - Complete Database Schema
-- PostgreSQL 15+
-- Version: 1.0
-- Date: October 16, 2025
-- =====================================================

-- =====================================================
-- EXTENSIONS
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- CUSTOM TYPES
-- =====================================================

-- Certificate status enum
CREATE TYPE certificate_status AS ENUM ('active', 'revoked', 'suspended');

-- Admin role enum
CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'course_manager');

-- Audit action enum
CREATE TYPE audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'REVOKE', 'LOGIN', 'LOGOUT');

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Admins Table
CREATE TABLE admins (
    admin_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role admin_role NOT NULL DEFAULT 'admin',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    mobile VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    failed_login_attempts INT DEFAULT 0,
    account_locked_until TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT admins_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Students Table
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    student_custom_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., CSL-2024-001
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    date_of_birth DATE,
    home_institution VARCHAR(200), -- Student's home institution or school
    profile_picture TEXT, -- URL or base64 encoded profile picture
    current_grade VARCHAR(20), -- Current academic grade or rating
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT students_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
    CONSTRAINT students_custom_id_format CHECK (student_custom_id ~* '^CSL-[0-9]{4}-[0-9]{3}$')
);

-- Courses Table
CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    code CHAR(2) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    duration_months INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT courses_code_uppercase CHECK (code = UPPER(code)),
    CONSTRAINT courses_duration_positive CHECK (duration_months > 0)
);

-- Student-Course Enrollment Junction Table
CREATE TABLE student_courses (
    student_course_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completion_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed', 'dropped', 'failed')),
    grade VARCHAR(5),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id) -- Prevent duplicate enrollments
);

-- Certificates Table
CREATE TABLE certificates (
    csl_number VARCHAR(20) PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(student_id) ON DELETE RESTRICT,
    course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE RESTRICT,
    issued_by_admin_id INT NOT NULL REFERENCES admins(admin_id) ON DELETE SET NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status certificate_status NOT NULL DEFAULT 'active',
    revoked_at TIMESTAMP,
    revoked_by_admin_id INT REFERENCES admins(admin_id) ON DELETE SET NULL,
    revocation_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT certificates_csl_format CHECK (csl_number ~ '^\d{4}-[A-Z]{2}-\d{4}-[A-Z0-9]{6}$'),
    CONSTRAINT certificates_revoked_logic CHECK (
        (status != 'revoked') OR 
        (status = 'revoked' AND revoked_at IS NOT NULL AND revoked_by_admin_id IS NOT NULL)
    )
);

-- =====================================================
-- AUDIT AND LOGGING TABLES
-- =====================================================

-- Audit Logs Table
CREATE TABLE audit_logs (
    log_id BIGSERIAL PRIMARY KEY,
    admin_id INT REFERENCES admins(admin_id) ON DELETE SET NULL,
    action audit_action NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Verification Logs Table
CREATE TABLE verification_logs (
    log_id BIGSERIAL PRIMARY KEY,
    csl_number VARCHAR(20),
    ip_address INET NOT NULL,
    user_agent TEXT,
    verification_result BOOLEAN NOT NULL,
    response_time_ms INT,
    verified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SYSTEM CONFIGURATION TABLE
-- =====================================================

CREATE TABLE system_config (
    config_key VARCHAR(100) PRIMARY KEY,
    config_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by_admin_id INT REFERENCES admins(admin_id) ON DELETE SET NULL
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Admins indexes
CREATE INDEX idx_admins_username ON admins(username);
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_role ON admins(role);
CREATE INDEX idx_admins_is_active ON admins(is_active);

-- Students indexes
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_name ON students USING gin (name gin_trgm_ops);
CREATE INDEX idx_students_deleted_at ON students(deleted_at) WHERE deleted_at IS NULL;

-- Courses indexes
CREATE INDEX idx_courses_code ON courses(code);
CREATE INDEX idx_courses_is_active ON courses(is_active);
CREATE INDEX idx_courses_deleted_at ON courses(deleted_at) WHERE deleted_at IS NULL;

-- Certificates indexes
CREATE INDEX idx_certificates_student_id ON certificates(student_id);
CREATE INDEX idx_certificates_course_id ON certificates(course_id);
CREATE INDEX idx_certificates_issue_date ON certificates(issue_date);
CREATE INDEX idx_certificates_status ON certificates(status);
CREATE INDEX idx_certificates_issued_by ON certificates(issued_by_admin_id);
CREATE INDEX idx_certificates_year_course ON certificates((SUBSTRING(csl_number FROM 1 FOR 7)));

-- Audit Logs indexes
CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Verification Logs indexes
CREATE INDEX idx_verification_logs_csl_number ON verification_logs(csl_number);
CREATE INDEX idx_verification_logs_verified_at ON verification_logs(verified_at);
CREATE INDEX idx_verification_logs_ip_address ON verification_logs(ip_address);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all relevant tables
CREATE TRIGGER update_admins_updated_at 
    BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at 
    BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at 
    BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at 
    BEFORE UPDATE ON certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log certificate changes
CREATE OR REPLACE FUNCTION log_certificate_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, new_values)
        VALUES (NEW.issued_by_admin_id, 'CREATE', 'certificate', NEW.csl_number, row_to_json(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, old_values, new_values)
        VALUES (
            COALESCE(NEW.revoked_by_admin_id, NEW.issued_by_admin_id),
            CASE WHEN NEW.status = 'revoked' THEN 'REVOKE' ELSE 'UPDATE' END,
            'certificate',
            NEW.csl_number,
            row_to_json(OLD),
            row_to_json(NEW)
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, old_values)
        VALUES (NULL, 'DELETE', 'certificate', OLD.csl_number, row_to_json(OLD));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_certificate_changes
    AFTER INSERT OR UPDATE OR DELETE ON certificates
    FOR EACH ROW EXECUTE FUNCTION log_certificate_changes();

-- =====================================================
-- FUNCTIONS FOR CSL GENERATION
-- =====================================================

-- Function to get next sequential number for a course in a given year
CREATE OR REPLACE FUNCTION get_next_sequential_number(
    p_year INT,
    p_course_code CHAR(2)
)
RETURNS INT AS $$
DECLARE
    v_next_number INT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(csl_number FROM 9 FOR 4) AS INT)), 0) + 1
    INTO v_next_number
    FROM certificates
    WHERE csl_number LIKE p_year || '-' || p_course_code || '-%';
    
    RETURN v_next_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INITIAL CONFIGURATION DATA
-- =====================================================

-- Insert system configuration defaults
INSERT INTO system_config (config_key, config_value, description) VALUES
    ('csl_pepper_key', 'CHANGE_THIS_IN_PRODUCTION', 'Secret key for CSL hash generation'),
    ('verification_rate_limit', '100', 'Max verification requests per IP per hour'),
    ('certificate_validity_years', '999', 'Certificate validity period in years (999 = permanent)'),
    ('backup_retention_days', '30', 'Number of days to retain database backups'),
    ('session_timeout_minutes', '60', 'Admin session timeout in minutes')
ON CONFLICT (config_key) DO NOTHING;

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for active certificates with student and course details
CREATE OR REPLACE VIEW v_active_certificates AS
SELECT 
    c.csl_number,
    c.issue_date,
    c.status,
    s.student_id,
    s.name AS student_name,
    s.email AS student_email,
    co.course_id,
    co.code AS course_code,
    co.title AS course_title,
    a.username AS issued_by
FROM certificates c
INNER JOIN students s ON c.student_id = s.student_id
INNER JOIN courses co ON c.course_id = co.course_id
INNER JOIN admins a ON c.issued_by_admin_id = a.admin_id
WHERE c.status = 'active' AND s.deleted_at IS NULL AND co.deleted_at IS NULL;

-- View for certificate statistics
CREATE OR REPLACE VIEW v_certificate_statistics AS
SELECT 
    EXTRACT(YEAR FROM issue_date) AS year,
    co.code AS course_code,
    co.title AS course_title,
    COUNT(*) AS total_issued,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_count,
    SUM(CASE WHEN status = 'revoked' THEN 1 ELSE 0 END) AS revoked_count
FROM certificates c
INNER JOIN courses co ON c.course_id = co.course_id
GROUP BY EXTRACT(YEAR FROM issue_date), co.code, co.title
ORDER BY year DESC, course_code;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE admins IS 'System administrators with role-based access control';
COMMENT ON TABLE students IS 'Student records for certificate issuance';
COMMENT ON TABLE courses IS 'Course catalog with unique 2-letter codes';
COMMENT ON TABLE certificates IS 'Issued certificates with cryptographic CSL numbers';
COMMENT ON TABLE audit_logs IS 'Audit trail for all critical system operations';
COMMENT ON TABLE verification_logs IS 'Public verification attempt logs';
COMMENT ON TABLE system_config IS 'System-wide configuration parameters';

COMMENT ON COLUMN certificates.csl_number IS 'Format: YYYY-CC-NNNN-VVVVVV (Year-CourseCode-Sequential-VerificationHash)';
COMMENT ON COLUMN certificates.status IS 'active: valid certificate, revoked: cancelled, suspended: temporarily invalid';

-- =====================================================
-- GRANTS AND PERMISSIONS
-- =====================================================

-- Create application user (adjust password in production)
-- CREATE ROLE csl_app_user WITH LOGIN PASSWORD 'CHANGE_THIS_PASSWORD';

-- Grant appropriate permissions
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO csl_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO csl_app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO csl_app_user;

-- =====================================================
-- DATABASE SETUP COMPLETE
-- =====================================================

-- Log schema creation
DO $$
BEGIN
    RAISE NOTICE 'CSL Management System database schema created successfully at %', NOW();
END $$;
