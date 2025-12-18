#!/usr/bin/env node

/**
 * Check Current Database Student Data Structure and Content
 */

console.log('📊 CSL Database Students Analysis');
console.log('=================================\n');

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'csl_user',
  password: process.env.DB_PASSWORD || 'csl_password',
  database: process.env.DB_NAME || 'csl_database'
});

async function analyzeStudentsData() {
  try {
    const client = await pool.connect();
    
    // 1. Check students table structure
    console.log('1️⃣ Students Table Structure:');
    console.log('============================');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'students' 
      ORDER BY ordinal_position
    `);
    
    columns.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });
    
    // 2. Check actual student data
    console.log('\n2️⃣ Sample Student Records:');
    console.log('===========================');
    const students = await client.query('SELECT * FROM students LIMIT 5');
    console.log(`Found ${students.rows.length} sample records:\n`);
    
    students.rows.forEach((student, index) => {
      console.log(`Student ${index + 1}:`);
      console.log(`   ID: ${student.student_id}`);
      console.log(`   Name: ${student.name}`);
      console.log(`   Email: ${student.email}`);
      console.log(`   Mobile: ${student.mobile}`);
      console.log(`   DOB: ${student.date_of_birth}`);
      console.log(`   Created: ${student.created_at}`);
      console.log('');
    });
    
    // 3. Check courses table structure
    console.log('3️⃣ Courses Table Structure:');
    console.log('============================');
    const courseCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'courses' 
      ORDER BY ordinal_position
    `);
    
    courseCols.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type}`);
    });
    
    // 4. Check if there are enrollment/enrollment relationships
    console.log('\n4️⃣ Related Tables:');
    console.log('==================');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('Available tables:');
    tables.rows.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
    // 5. Check for any enrollment or student-course relationships
    console.log('\n5️⃣ Student-Course Relationships:');
    console.log('=================================');
    
    try {
      // Check if there are any certificates linking students to courses
      const certs = await client.query(`
        SELECT 
          s.name as student_name,
          s.email as student_email,
          c.title as course_title,
          cert.csl_number,
          cert.issue_date,
          cert.status
        FROM certificates cert
        JOIN students s ON cert.student_id = s.student_id
        JOIN courses c ON cert.course_id = c.course_id
        LIMIT 5
      `);
      
      if (certs.rows.length > 0) {
        console.log('Found certificate relationships:');
        certs.rows.forEach(cert => {
          console.log(`   ${cert.student_name} -> ${cert.course_title} (${cert.csl_number})`);
        });
      } else {
        console.log('No certificate relationships found');
      }
      
    } catch (error) {
      console.log(`Error checking relationships: ${error.message}`);
    }
    
    // 6. Count totals
    console.log('\n6️⃣ Data Summary:');
    console.log('================');
    const studentCount = await client.query('SELECT COUNT(*) FROM students');
    const courseCount = await client.query('SELECT COUNT(*) FROM courses');
    const certCount = await client.query('SELECT COUNT(*) FROM certificates');
    
    console.log(`   Total Students: ${studentCount.rows[0].count}`);
    console.log(`   Total Courses: ${courseCount.rows[0].count}`);
    console.log(`   Total Certificates: ${certCount.rows[0].count}`);
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

analyzeStudentsData();
