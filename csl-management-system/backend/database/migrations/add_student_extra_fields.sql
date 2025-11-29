-- Migration: Add extra columns to students table for frontend fields
ALTER TABLE students
  ADD COLUMN profile_picture TEXT,
  ADD COLUMN grade VARCHAR(50),
  ADD COLUMN institution VARCHAR(100);
-- If you want to add course_id, consider a join table for many-to-many, but for now:
ALTER TABLE students
  ADD COLUMN course_id INTEGER;
-- You may want to add foreign key constraints for course_id if courses table exists.