#!/usr/bin/env node

/**
 * Check student data in database
 */

const { Pool } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'csl_user',
  password: 'csl_password',
  database: 'csl_database'
};

async function checkStudentData() {
  console.log('Checking student data in database...\n');

  try {
    const pool = new Pool(config);
    const client = await pool.connect();

    // Get one recent student with all fields
    const result = await client.query(`
      SELECT student_id, student_custom_id, name, email, 
             profile_picture, institution, grade,
             created_at
      FROM students 
      ORDER BY created_at DESC 
      LIMIT 3
    `);

    console.log(`Found ${result.rows.length} recent students:\n`);
    
    result.rows.forEach((student, index) => {
      console.log(`Student #${index + 1}:`);
      console.log(`  ID: ${student.student_id}`);
      console.log(`  Custom ID: ${student.student_custom_id}`);
      console.log(`  Name: ${student.name}`);
      console.log(`  Email: ${student.email}`);
      console.log(`  Profile Picture: ${student.profile_picture || '(NULL)'}`);
      console.log(`  Institution: ${student.institution || '(NULL)'}`);
      console.log(`  Grade: ${student.grade || '(NULL)'}`);
      console.log(`  Created: ${student.created_at}`);
      console.log('');
    });

    client.release();
    await pool.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkStudentData();
