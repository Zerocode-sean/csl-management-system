import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

/**
 * Global setup runs once before all tests
 * Creates the test database and schema
 */
export default async () => {
  console.log('\n🔧 Global Test Setup: Creating test database...\n');

  // Connect to PostgreSQL server (not the test database yet)
  const setupPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'csl_user',
    password: process.env.DB_PASSWORD,
    database: 'postgres', // Connect to default database first
  });

  const testDbName = process.env.DB_NAME || 'csl_test_db';

  try {
    // Drop test database if it exists (clean slate)
    await setupPool.query(`DROP DATABASE IF EXISTS ${testDbName}`);
    console.log(`✓ Dropped existing test database: ${testDbName}`);

    // Create fresh test database
    await setupPool.query(`CREATE DATABASE ${testDbName}`);
    console.log(`✓ Created test database: ${testDbName}`);

    await setupPool.end();

    // Now connect to the test database to create schema
    const testPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'csl_user',
      password: process.env.DB_PASSWORD,
      database: testDbName,
    });

    // Create schema
    await testPool.query(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('super_admin', 'admin', 'course_manager', 'instructor', 'student')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Courses table
      CREATE TABLE IF NOT EXISTS courses (
        course_id SERIAL PRIMARY KEY,
        course_code VARCHAR(10) UNIQUE NOT NULL,
        course_name VARCHAR(255) NOT NULL,
        description TEXT,
        duration_weeks INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Students table
      CREATE TABLE IF NOT EXISTS students (
        student_id SERIAL PRIMARY KEY,
        student_custom_id VARCHAR(50) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        course_id INTEGER REFERENCES courses(course_id),
        enrollment_date DATE,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Certificates table
      CREATE TABLE IF NOT EXISTS certificates (
        certificate_id SERIAL PRIMARY KEY,
        csl_number VARCHAR(50) UNIQUE NOT NULL,
        student_id INTEGER NOT NULL REFERENCES students(student_id),
        course_id INTEGER NOT NULL REFERENCES courses(course_id),
        issued_by INTEGER REFERENCES users(user_id),
        issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completion_date DATE,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'suspended')),
        revoked_at TIMESTAMP,
        revoked_by INTEGER REFERENCES users(user_id),
        revocation_reason TEXT,
        pdf_path VARCHAR(500),
        qr_code_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Audit logs table
      CREATE TABLE IF NOT EXISTS audit_logs (
        log_id SERIAL PRIMARY KEY,
        admin_id INTEGER REFERENCES users(user_id),
        action VARCHAR(50) NOT NULL,
        table_name VARCHAR(50),
        record_id VARCHAR(50),
        old_data JSONB,
        new_data JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✓ Created database schema');

    // Create the CSL number generation function
    await testPool.query(`
      CREATE OR REPLACE FUNCTION get_next_sequential_number(
        p_year INT,
        p_course_code VARCHAR
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
    `);

    console.log('✓ Created database schema');

    // Insert test data
    await testPool.query(`
      -- Insert test admin user
      INSERT INTO users (username, email, password_hash, role)
      VALUES 
        ('testadmin', 'admin@test.com', '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'admin'),
        ('testmanager', 'manager@test.com', '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'course_manager')
      ON CONFLICT (username) DO NOTHING;

      -- Insert test courses
      INSERT INTO courses (course_code, course_name, description, duration_weeks)
      VALUES 
        ('WD101', 'Web Development Bootcamp', 'Full stack web development', 12),
        ('DS101', 'Data Science Fundamentals', 'Introduction to data science', 16),
        ('ML101', 'Machine Learning Basics', 'ML and AI fundamentals', 14)
      ON CONFLICT (course_code) DO NOTHING;
    `);

    console.log('✓ Inserted test data');
    console.log('✓ Test database ready!\n');

    await testPool.end();
  } catch (error) {
    console.error('❌ Error setting up test database:', error);
    throw error;
  }
};
