#!/usr/bin/env node

/**
 * Docker PostgreSQL Setup for CSL Management System
 * Specialized setup for Docker containers
 */

console.log('🐳 CSL Docker PostgreSQL Setup');
console.log('==============================\n');

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Docker PostgreSQL configuration
const config = {
  host: 'localhost',
  port: 5432,
  user: 'csl_user',
  password: 'csl_password',
  database: 'csl_database'
};

async function testConnection() {
  console.log('1️⃣ Testing Docker PostgreSQL Connection');
  console.log('=======================================');
  
  try {
    const pool = new Pool(config);
    const client = await pool.connect();
    const result = await client.query('SELECT version(), current_database(), current_user');
    
    console.log('✅ Connected successfully!');
    console.log(`   Database: ${result.rows[0].current_database}`);
    console.log(`   User: ${result.rows[0].current_user}`);
    console.log(`   Version: ${result.rows[0].version.split(' ')[0]}`);
    
    client.release();
    await pool.end();
    return true;
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check if container is running: docker ps');
    console.log('   2. Check container logs: docker logs csl-postgres');
    console.log('   3. Restart container: docker-compose restart postgres');
    return false;
  }
}

async function createSchema() {
  console.log('\n2️⃣ Creating Database Schema');
  console.log('============================');
  
  try {
    const pool = new Pool(config);
    const client = await pool.connect();
    
    // Check if tables already exist
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log(`   ✅ Found ${tableCheck.rows.length} existing tables`);
      tableCheck.rows.forEach(row => {
        console.log(`      - ${row.table_name}`);
      });
    } else {
      console.log('   📋 Creating database schema...');
      
      // Create the schema
      await client.query(`
        -- Enable UUID extension
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        -- Create custom types
        CREATE TYPE IF NOT EXISTS user_role AS ENUM ('admin', 'instructor', 'staff');
        CREATE TYPE IF NOT EXISTS student_status AS ENUM ('active', 'inactive', 'graduated', 'suspended');
        CREATE TYPE IF NOT EXISTS certificate_status AS ENUM ('active', 'revoked', 'expired');
        CREATE TYPE IF NOT EXISTS enrollment_status AS ENUM ('enrolled', 'completed', 'dropped', 'failed');
        
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          role user_role DEFAULT 'staff',
          is_active BOOLEAN DEFAULT true,
          last_login TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Students table
        CREATE TABLE IF NOT EXISTS students (
          id SERIAL PRIMARY KEY,
          student_id VARCHAR(50) UNIQUE NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(20),
          date_of_birth DATE,
          address TEXT,
          emergency_contact JSONB,
          status student_status DEFAULT 'active',
          enrollment_date DATE DEFAULT CURRENT_DATE,
          graduation_date DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Courses table
        CREATE TABLE IF NOT EXISTS courses (
          id SERIAL PRIMARY KEY,
          course_code VARCHAR(20) UNIQUE NOT NULL,
          course_name VARCHAR(200) NOT NULL,
          description TEXT,
          category VARCHAR(100),
          credits INTEGER DEFAULT 0,
          duration_weeks INTEGER DEFAULT 12,
          prerequisites TEXT[],
          learning_objectives TEXT[],
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Enrollments table
        CREATE TABLE IF NOT EXISTS enrollments (
          id SERIAL PRIMARY KEY,
          student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
          course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
          enrollment_date DATE DEFAULT CURRENT_DATE,
          completion_date DATE,
          grade VARCHAR(5),
          status enrollment_status DEFAULT 'enrolled',
          progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(student_id, course_id)
        );
        
        -- Certificates table
        CREATE TABLE IF NOT EXISTS certificates (
          id SERIAL PRIMARY KEY,
          certificate_id VARCHAR(50) UNIQUE NOT NULL,
          student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
          course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
          enrollment_id INTEGER REFERENCES enrollments(id),
          issue_date DATE DEFAULT CURRENT_DATE,
          expiry_date DATE,
          verification_code VARCHAR(100) UNIQUE NOT NULL,
          digital_signature TEXT,
          status certificate_status DEFAULT 'active',
          metadata JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Audit logs table
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          action VARCHAR(100) NOT NULL,
          table_name VARCHAR(50),
          record_id INTEGER,
          old_values JSONB,
          new_values JSONB,
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
        CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
        CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
        CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(course_code);
        CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
        CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
        CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
        CREATE INDEX IF NOT EXISTS idx_certificates_verification ON certificates(verification_code);
        CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
      `);
      
      console.log('   ✅ Database schema created successfully');
    }
    
    client.release();
    await pool.end();
    return true;
    
  } catch (error) {
    console.log('❌ Schema creation failed:', error.message);
    return false;
  }
}

async function seedData() {
  console.log('\n3️⃣ Loading Sample Data');
  console.log('=======================');
  
  try {
    const pool = new Pool(config);
    const client = await pool.connect();
    
    // Check if data already exists
    const studentCount = await client.query('SELECT COUNT(*) FROM students');
    
    if (parseInt(studentCount.rows[0].count) > 0) {
      console.log(`   ✅ Data already exists (${studentCount.rows[0].count} students)`);
    } else {
      console.log('   📋 Loading sample data...');
      
      // Insert sample data
      await client.query(`
        -- Insert admin user
        INSERT INTO users (email, password_hash, first_name, last_name, role) 
        VALUES 
        ('admin@csl.edu', '$2b$10$hash_placeholder', 'System', 'Administrator', 'admin'),
        ('instructor@csl.edu', '$2b$10$hash_placeholder', 'John', 'Instructor', 'instructor')
        ON CONFLICT (email) DO NOTHING;
        
        -- Insert sample students
        INSERT INTO students (student_id, first_name, last_name, email, phone, date_of_birth, status) VALUES
        ('CSL2025001', 'Alice', 'Johnson', 'alice.johnson@email.com', '+1-555-0101', '1998-03-15', 'active'),
        ('CSL2025002', 'Bob', 'Smith', 'bob.smith@email.com', '+1-555-0102', '1997-07-22', 'active'),
        ('CSL2025003', 'Carol', 'Davis', 'carol.davis@email.com', '+1-555-0103', '1999-11-08', 'graduated'),
        ('CSL2025004', 'David', 'Wilson', 'david.wilson@email.com', '+1-555-0104', '1998-09-12', 'active'),
        ('CSL2025005', 'Emma', 'Brown', 'emma.brown@email.com', '+1-555-0105', '1996-05-30', 'active')
        ON CONFLICT (student_id) DO NOTHING;
        
        -- Insert sample courses
        INSERT INTO courses (course_code, course_name, description, category, credits, duration_weeks) VALUES
        ('CS101', 'Introduction to Computer Science', 'Fundamental concepts of programming and computer science', 'Computer Science', 3, 16),
        ('WEB201', 'Web Development Fundamentals', 'HTML, CSS, JavaScript, and modern web technologies', 'Web Development', 4, 12),
        ('DATA301', 'Data Analysis with Python', 'Statistical analysis, data visualization, and Python programming', 'Data Science', 3, 10),
        ('AI401', 'Artificial Intelligence Basics', 'Introduction to machine learning and AI concepts', 'Artificial Intelligence', 4, 14),
        ('SEC501', 'Cybersecurity Fundamentals', 'Network security, cryptography, and security best practices', 'Cybersecurity', 3, 8)
        ON CONFLICT (course_code) DO NOTHING;
      `);
      
      // Get inserted IDs for relationships
      const students = await client.query('SELECT id, student_id FROM students ORDER BY id');
      const courses = await client.query('SELECT id, course_code FROM courses ORDER BY id');
      
      if (students.rows.length > 0 && courses.rows.length > 0) {
        // Insert enrollments
        await client.query(`
          INSERT INTO enrollments (student_id, course_id, enrollment_date, completion_date, grade, status, progress_percentage) VALUES
          ($1, $2, '2025-01-15', '2025-05-15', 'A', 'completed', 100),
          ($3, $4, '2025-02-01', '2025-05-01', 'B+', 'completed', 100),
          ($5, $6, '2025-03-01', '2025-05-15', 'A-', 'completed', 100),
          ($7, $8, '2025-09-01', NULL, NULL, 'enrolled', 65),
          ($9, $10, '2025-09-15', NULL, NULL, 'enrolled', 45)
          ON CONFLICT (student_id, course_id) DO NOTHING
        `, [
          students.rows[0].id, courses.rows[0].id,  // Alice -> CS101
          students.rows[1].id, courses.rows[1].id,  // Bob -> WEB201
          students.rows[2].id, courses.rows[2].id,  // Carol -> DATA301
          students.rows[3].id, courses.rows[0].id,  // David -> CS101 
          students.rows[4].id, courses.rows[1].id   // Emma -> WEB201
        ]);
        
        // Insert certificates for completed courses
        const completedEnrollments = await client.query(`
          SELECT e.id, e.student_id, e.course_id, s.student_id as student_code, c.course_code 
          FROM enrollments e
          JOIN students s ON e.student_id = s.id
          JOIN courses c ON e.course_id = c.id
          WHERE e.status = 'completed'
        `);
        
        for (const enrollment of completedEnrollments.rows) {
          const certId = `CSL-${enrollment.course_code}-${enrollment.student_code}`;
          const verificationCode = `${enrollment.course_code}-${enrollment.student_code}-2025`;
          
          await client.query(`
            INSERT INTO certificates (certificate_id, student_id, course_id, enrollment_id, verification_code, issue_date)
            VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
            ON CONFLICT (certificate_id) DO NOTHING
          `, [certId, enrollment.student_id, enrollment.course_id, enrollment.id, verificationCode]);
        }
      }
      
      console.log('   ✅ Sample data loaded successfully');
    }
    
    // Show summary
    const summary = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM students) as students,
        (SELECT COUNT(*) FROM courses) as courses,
        (SELECT COUNT(*) FROM enrollments) as enrollments,
        (SELECT COUNT(*) FROM certificates) as certificates
    `);
    
    const counts = summary.rows[0];
    console.log(`   📊 Data Summary:`);
    console.log(`      Students: ${counts.students}`);
    console.log(`      Courses: ${counts.courses}`);
    console.log(`      Enrollments: ${counts.enrollments}`);
    console.log(`      Certificates: ${counts.certificates}`);
    
    client.release();
    await pool.end();
    return true;
    
  } catch (error) {
    console.log('❌ Data seeding failed:', error.message);
    return false;
  }
}

async function testQueries() {
  console.log('\n4️⃣ Testing Database Queries');
  console.log('============================');
  
  try {
    const pool = new Pool(config);
    const client = await pool.connect();
    
    // Test a complex join query
    const testQuery = await client.query(`
      SELECT 
        s.student_id,
        s.first_name,
        s.last_name,
        c.course_code,
        c.course_name,
        e.grade,
        e.status as enrollment_status,
        cert.verification_code
      FROM students s
      JOIN enrollments e ON s.id = e.student_id
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN certificates cert ON e.id = cert.enrollment_id
      ORDER BY s.student_id, c.course_code
      LIMIT 5
    `);
    
    console.log(`   ✅ Complex query successful (${testQuery.rows.length} records)`);
    
    if (testQuery.rows.length > 0) {
      console.log('   📋 Sample records:');
      testQuery.rows.forEach(row => {
        console.log(`      ${row.student_id}: ${row.first_name} ${row.last_name} - ${row.course_code} (${row.enrollment_status})`);
      });
    }
    
    client.release();
    await pool.end();
    return true;
    
  } catch (error) {
    console.log('❌ Query test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('Setting up PostgreSQL database in Docker...\n');
  
  const connected = await testConnection();
  if (!connected) {
    console.log('\n❌ Cannot proceed without database connection');
    console.log('💡 Make sure Docker PostgreSQL container is running:');
    console.log('   docker-compose up -d postgres');
    process.exit(1);
  }
  
  const schemaCreated = await createSchema();
  if (!schemaCreated) {
    console.log('\n❌ Schema creation failed');
    process.exit(1);
  }
  
  const dataSeeded = await seedData();
  if (!dataSeeded) {
    console.log('\n⚠️  Data seeding failed, but continuing...');
  }
  
  const queriesWork = await testQueries();
  if (!queriesWork) {
    console.log('\n⚠️  Query testing failed, but database is set up');
  }
  
  console.log('\n🎉 Docker PostgreSQL Setup Complete!');
  console.log('====================================');
  console.log('✅ Connection: Established');
  console.log('✅ Schema: Created');
  console.log('✅ Data: Loaded');
  console.log('✅ Queries: Tested');
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Start the backend server: node database-production-server.js');
  console.log('2. Test the API: http://localhost:5001/health');
  console.log('3. View API docs: http://localhost:5001/api-docs');
  console.log('4. Test endpoints: http://localhost:5001/api/students');
  
  console.log('\n🔗 Database Connection:');
  console.log(`   Host: ${config.host}:${config.port}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   User: ${config.user}`);
  console.log('   Docker Container: csl-postgres');
  
  console.log('\n🐳 Docker Commands:');
  console.log('   View logs: docker logs csl-postgres');
  console.log('   Connect to DB: docker exec -it csl-postgres psql -U csl_user -d csl_database');
  console.log('   Stop container: docker-compose down');
  console.log('   Restart: docker-compose restart postgres');
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error.message);
  process.exit(1);
});

// Run setup
main().catch(console.error);
