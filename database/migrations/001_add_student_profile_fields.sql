-- =====================================================
-- Migration: Add Student Profile Fields
-- Date: 2025-11-30
-- Description: Add home_institution, profile_picture, and current_grade fields to students table
-- =====================================================

-- Add new columns to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS home_institution VARCHAR(200),
ADD COLUMN IF NOT EXISTS profile_picture TEXT,
ADD COLUMN IF NOT EXISTS current_grade VARCHAR(20);

-- Add comments for documentation
COMMENT ON COLUMN students.home_institution IS 'The home institution or school the student is affiliated with';
COMMENT ON COLUMN students.profile_picture IS 'URL or base64 encoded profile picture of the student';
COMMENT ON COLUMN students.current_grade IS 'Current academic grade or rating of the student';

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Added home_institution, profile_picture, and current_grade to students table at %', NOW();
END $$;
