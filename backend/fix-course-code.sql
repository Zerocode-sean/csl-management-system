-- Fix course code column length issue
-- Current: CHAR(2)
-- New: VARCHAR(10)

-- This will allow course codes like "CS101", "WEB-DEV", etc.

ALTER TABLE courses 
ALTER COLUMN code TYPE VARCHAR(10);

-- Verify the change
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'courses' AND column_name = 'code';
