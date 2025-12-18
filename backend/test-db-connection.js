#!/usr/bin/env node

/**
 * Quick Database Connection Test
 */

console.log('🔍 Testing Database Connection...\n');

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'csl_user',
  password: process.env.DB_PASSWORD || 'csl_password',
  database: process.env.DB_NAME || 'csl_database'
});

async function testConnection() {
  try {
    console.log('Connecting to PostgreSQL...');
    const client = await pool.connect();
    
    console.log('✅ Connected successfully!');
    
    // Test basic query
    const result = await client.query('SELECT COUNT(*) as student_count FROM students');
    console.log(`✅ Query test passed - Found ${result.rows[0].student_count} students`);
    
    // Test API-like query
    const students = await client.query('SELECT student_id, name, email FROM students LIMIT 5');
    console.log('✅ Sample students:');
    students.rows.forEach(student => {
      console.log(`   ${student.student_id}: ${student.name} (${student.email})`);
    });
    
    client.release();
    console.log('\n🎉 Database is ready for production backend!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();
