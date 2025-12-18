-- Fix the get_next_sequential_number function to handle variable-length course codes
-- The old function assumed course codes were 2-3 characters, but "CS101" is 5 characters

CREATE OR REPLACE FUNCTION get_next_sequential_number(p_year integer, p_course_code character varying)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    v_next_number INT;
    v_pattern TEXT;
BEGIN
    -- Build the pattern for matching CSL numbers
    -- Format: YYYY-COURSECODE-NNNN-HASH (e.g., 2025-CS101-0001-37B620)
    v_pattern := p_year || '-' || p_course_code || '-%';
    
    -- Extract the 4-digit sequence number by:
    -- 1. Finding all CSL numbers matching the year and course code
    -- 2. Extracting the sequence part (after second dash, 4 characters)
    -- 3. Getting the maximum value and adding 1
    SELECT COALESCE(MAX(
        CAST(
            SPLIT_PART(SPLIT_PART(csl_number, '-', 3), '-', 1) 
            AS INT
        )
    ), 0) + 1
    INTO v_next_number
    FROM certificates
    WHERE csl_number LIKE v_pattern;
    
    RETURN v_next_number;
END;
$$;

-- Test the function
SELECT get_next_sequential_number(2025, 'CS101') as next_number;
