-- Fix course code column length issue
-- Drop dependent views, alter column, recreate views

-- Drop the dependent views
DROP VIEW IF EXISTS v_active_certificates;
DROP VIEW IF EXISTS v_certificate_statistics;

-- Alter the column type
ALTER TABLE courses
ALTER COLUMN code TYPE VARCHAR(10);

-- Recreate the views
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

-- Verify the change
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'courses' AND column_name = 'code';