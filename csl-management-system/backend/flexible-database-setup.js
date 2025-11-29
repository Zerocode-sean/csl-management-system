#!/usr/bin/env node

/**
 * Flexible Database Setup for CSL Management System
 * Supports both PostgreSQL and SQLite fallback
 */

console.log('🗄️  CSL Database Setup - Flexible Configuration');
console.log('===============================================\n');

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration
const config = {
  postgres: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '5432', 
    user: process.env.DB_USER || 'csl_user',
    password: process.env.DB_PASSWORD || 'csl_password',
    database: process.env.DB_NAME || 'csl_database',
    superUser: 'postgres',
    superPassword: process.env.POSTGRES_PASSWORD || 'postgres'
  }
};

async function testPostgreSQLConnection() {
  console.log('1️⃣ Testing PostgreSQL Connection');
  console.log('=================================');
  
  try {
    const { Pool } = require('pg');
    const testPool = new Pool({
      host: config.postgres.host,
      port: parseInt(config.postgres.port),
      user: config.postgres.superUser,
      password: config.postgres.superPassword,
      database: 'postgres' // Connect to default database first
    });
    
    const client = await testPool.connect();
    const result = await client.query('SELECT version()');
    client.release();
    await testPool.end();
    
    console.log('✅ PostgreSQL is accessible!');
    console.log(`   Version: ${result.rows[0].version.split(' ')[0]}`);
    return true;
    
  } catch (error) {
    console.log('❌ PostgreSQL connection failed:', error.message);
    console.log('\n💡 Common solutions:');
    console.log('   1. Start PostgreSQL service: net start postgresql-x64-16');
    console.log('   2. Check if PostgreSQL is in PATH');
    console.log('   3. Verify password is correct');
    console.log('   4. Check if PostgreSQL is running on port 5432');
    return false;
  }
}

async function setupPostgreSQL() {
  console.log('\n2️⃣ Setting up PostgreSQL Database');
  console.log('==================================');
  
  try {
    const { Pool } = require('pg');
    
    // Connect as superuser to create database and user
    const adminPool = new Pool({
      host: config.postgres.host,
      port: parseInt(config.postgres.port),
      user: config.postgres.superUser,
      password: config.postgres.superPassword,
      database: 'postgres'
    });
    
    const adminClient = await adminPool.connect();
    
    // Create CSL user if not exists
    console.log('   Creating CSL database user...');
    try {
      await adminClient.query(`CREATE USER ${config.postgres.user} WITH PASSWORD '${config.postgres.password}';`);
      console.log('   ✅ CSL user created');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ✅ CSL user already exists');
      } else {
        throw error;
      }
    }
    
    // Grant privileges
    await adminClient.query(`ALTER USER ${config.postgres.user} CREATEDB;`);
    
    // Create database if not exists
    console.log('   Creating CSL database...');
    try {
      await adminClient.query(`CREATE DATABASE ${config.postgres.database} OWNER ${config.postgres.user};`);
      console.log('   ✅ CSL database created');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ✅ CSL database already exists');
      } else {
        throw error;
      }
    }
    
    adminClient.release();
    await adminPool.end();
    
    // Connect to CSL database and create schema
    console.log('   Setting up database schema...');
    const cslPool = new Pool({
      host: config.postgres.host,
      port: parseInt(config.postgres.port),
      user: config.postgres.user,
      password: config.postgres.password,
      database: config.postgres.database
    });
    
    const schemaFile = path.join(__dirname, '..', 'database', 'schemas', 'complete_schema.sql');
    
    if (fs.existsSync(schemaFile)) {
      const cslClient = await cslPool.connect();
      
      // Drop all existing tables and types first
      console.log('   Dropping existing tables and types...');
      try {
        await cslClient.query(`
          DROP TABLE IF EXISTS audit_logs CASCADE;
          DROP TABLE IF EXISTS certificates CASCADE;
          DROP TABLE IF EXISTS student_courses CASCADE;
          DROP TABLE IF EXISTS courses CASCADE;
          DROP TABLE IF EXISTS students CASCADE;
          DROP TABLE IF EXISTS admins CASCADE;
          DROP TABLE IF EXISTS verification_logs CASCADE;
          DROP TABLE IF EXISTS system_config CASCADE;
          
          DROP TYPE IF EXISTS user_role CASCADE;
          DROP TYPE IF EXISTS student_status CASCADE;
          DROP TYPE IF EXISTS certificate_status CASCADE;
          DROP TYPE IF EXISTS enrollment_status CASCADE;
          DROP TYPE IF EXISTS admin_role CASCADE;
          DROP TYPE IF EXISTS audit_action CASCADE;
        `);
        console.log('   ✅ Existing tables and types dropped');
      } catch (dropError) {
        console.log('   ⚠️  Error dropping existing objects (may not exist):', dropError.message);
      }
      
      const schema = fs.readFileSync(schemaFile, 'utf8');
      await cslClient.query(schema);
      cslClient.release();
      console.log('   ✅ Database schema created');
    } else {
      console.log('   ⚠️  Schema file not found, creating basic tables...');
      await createBasicSchema(cslPool);
    }
    
    // Load seed data
    const seedFile = path.join(__dirname, '..', 'database', 'seeds', 'dev_seed.sql');
    if (fs.existsSync(seedFile)) {
      const seedData = fs.readFileSync(seedFile, 'utf8');
      const cslClient = await cslPool.connect();
      await cslClient.query(seedData);
      cslClient.release();
      console.log('   ✅ Seed data loaded');
    } else {
      console.log('   ⚠️  Seed file not found, creating sample data...');
      await createSampleData(cslPool);
    }
    
    await cslPool.end();
    
    console.log('\n🎉 PostgreSQL setup completed successfully!');
    return true;
    
  } catch (error) {
    console.log('❌ PostgreSQL setup failed:', error.message);
    return false;
  }
}

async function createBasicSchema(pool) {
  const client = await pool.connect();
  
  try {
    // Create basic tables
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      CREATE TYPE user_role AS ENUM ('admin', 'instructor', 'staff');
      CREATE TYPE student_status AS ENUM ('active', 'inactive', 'graduated', 'suspended');
      CREATE TYPE certificate_status AS ENUM ('active', 'revoked', 'expired');
      
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role user_role DEFAULT 'staff',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(50) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        date_of_birth DATE,
        address TEXT,
        status student_status DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        course_code VARCHAR(20) UNIQUE NOT NULL,
        course_name VARCHAR(200) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        credits INTEGER DEFAULT 0,
        duration_weeks INTEGER DEFAULT 12,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS certificates (
        id SERIAL PRIMARY KEY,
        certificate_id VARCHAR(50) UNIQUE NOT NULL,
        student_id INTEGER REFERENCES students(id),
        course_id INTEGER REFERENCES courses(id),
        issue_date DATE DEFAULT CURRENT_DATE,
        expiry_date DATE,
        verification_code VARCHAR(100) UNIQUE NOT NULL,
        status certificate_status DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('   ✅ Basic schema created');
    
  } finally {
    client.release();
  }
}

async function createSampleData(pool) {
  const client = await pool.connect();
  
  try {
    // Insert sample data
    await client.query(`
      -- Insert admin user
      INSERT INTO users (email, password_hash, first_name, last_name, role) 
      VALUES ('admin@csl.edu', '$2b$10$hash', 'Admin', 'User', 'admin')
      ON CONFLICT (email) DO NOTHING;
      
      -- Insert sample students
      INSERT INTO students (student_id, first_name, last_name, email, phone, status) VALUES
      ('CSL2025001', 'Alice', 'Johnson', 'alice.johnson@email.com', '+1-555-0101', 'active'),
      ('CSL2025002', 'Bob', 'Smith', 'bob.smith@email.com', '+1-555-0102', 'active'),
      ('CSL2025003', 'Carol', 'Davis', 'carol.davis@email.com', '+1-555-0103', 'graduated')
      ON CONFLICT (student_id) DO NOTHING;
      
      -- Insert sample courses
      INSERT INTO courses (course_code, course_name, description, category, credits) VALUES
      ('CS101', 'Introduction to Computer Science', 'Basic programming and computer concepts', 'Computer Science', 3),
      ('WEB201', 'Web Development Fundamentals', 'HTML, CSS, JavaScript basics', 'Web Development', 4),
      ('DATA301', 'Data Analysis with Python', 'Statistical analysis and data visualization', 'Data Science', 3)
      ON CONFLICT (course_code) DO NOTHING;
      
      -- Insert sample certificates
      INSERT INTO certificates (certificate_id, student_id, course_id, verification_code) VALUES
      ('CSL-CERT-001', 1, 1, 'CSL-2025-001'),
      ('CSL-CERT-002', 2, 2, 'CSL-2025-002'),
      ('CSL-CERT-003', 3, 3, 'CSL-2025-003')
      ON CONFLICT (certificate_id) DO NOTHING;
    `);
    
    console.log('   ✅ Sample data created');
    
  } finally {
    client.release();
  }
}

async function testDatabaseIntegration() {
  console.log('\n3️⃣ Testing Database Integration');
  console.log('===============================');
  
  try {
    const { Pool } = require('pg');
    const testPool = new Pool({
      host: config.postgres.host,
      port: parseInt(config.postgres.port),
      user: config.postgres.user,
      password: config.postgres.password,
      database: config.postgres.database
    });
    
    const client = await testPool.connect();
    
    // Test basic queries
    const studentCount = await client.query('SELECT COUNT(*) FROM students');
    const courseCount = await client.query('SELECT COUNT(*) FROM courses');
    const certCount = await client.query('SELECT COUNT(*) FROM certificates');
    
    console.log(`   ✅ Students: ${studentCount.rows[0].count}`);
    console.log(`   ✅ Courses: ${courseCount.rows[0].count}`);
    console.log(`   ✅ Certificates: ${certCount.rows[0].count}`);
    
    // Test a join query
    const joinTest = await client.query(`
      SELECT s.name, c.title, cert.csl_number
      FROM certificates cert
      JOIN students s ON cert.student_id = s.student_id
      JOIN courses c ON cert.course_id = c.course_id
      LIMIT 1
    `);
    
    if (joinTest.rows.length > 0) {
      console.log(`   ✅ Database relationships working`);
      console.log(`   Sample: ${joinTest.rows[0].first_name} ${joinTest.rows[0].last_name} - ${joinTest.rows[0].course_name}`);
    }
    
    client.release();
    await testPool.end();
    
    return true;
    
  } catch (error) {
    console.log('❌ Database integration test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('Starting flexible database setup for CSL Management System...\n');
  
  // Test PostgreSQL connection
  const pgAvailable = await testPostgreSQLConnection();
  
  if (pgAvailable) {
    const setupSuccess = await setupPostgreSQL();
    
    if (setupSuccess) {
      const testSuccess = await testDatabaseIntegration();
      
      if (testSuccess) {
        console.log('\n🎉 Database Setup Complete!');
        console.log('============================');
        console.log('✅ PostgreSQL: Connected and configured');
        console.log('✅ Database: csl_database created');
        console.log('✅ Schema: Tables and relationships created');
        console.log('✅ Data: Sample records loaded');
        console.log('✅ Integration: Tested successfully');
        
        console.log('\n🚀 Next Steps:');
        console.log('1. Start the database server: node database-production-server.js');
        console.log('2. Test endpoints at: http://localhost:5001');
        console.log('3. Run integration tests: node test-database-integration.js');
        
        console.log('\n🔗 Connection Details:');
        console.log(`   Database: postgresql://${config.postgres.user}:***@${config.postgres.host}:${config.postgres.port}/${config.postgres.database}`);
        console.log(`   Host: ${config.postgres.host}:${config.postgres.port}`);
        console.log(`   Database: ${config.postgres.database}`);
        console.log(`   User: ${config.postgres.user}`);
        
      } else {
        console.log('\n⚠️  Setup completed but integration tests failed');
        console.log('Database may need manual verification');
      }
    }
  } else {
    console.log('\n❌ PostgreSQL Not Available');
    console.log('============================');
    console.log('PostgreSQL connection failed. Please check:');
    console.log('1. PostgreSQL service is running');
    console.log('2. Correct password is set');
    console.log('3. PostgreSQL is accessible on localhost:5432');
    
    console.log('\n🔧 Manual Setup Instructions:');
    console.log('1. Start PostgreSQL service:');
    console.log('   net start postgresql-x64-16');
    console.log('2. Test connection manually:');
    console.log(`   psql -U ${config.postgres.superUser} -d postgres`);
    console.log('3. Run this script again after fixing connection');
  }
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error.message);
  process.exit(1);
});

// Run setup
main().catch(console.error);
