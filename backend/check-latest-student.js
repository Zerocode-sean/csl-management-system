#!/usr/bin/env node

/**
 * Check the most recently created student
 */

const { Pool } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'csl_user',
  password: 'csl_password',
  database: 'csl_database'
};

async function checkLatestStudent() {
  console.log('Checking most recent student...\n');

  try {
    const pool = new Pool(config);
    const client = await pool.connect();

    const result = await client.query(`
      SELECT student_id, student_custom_id, name, email, 
             profile_picture, institution, grade,
             created_at,
             CASE 
               WHEN profile_picture IS NULL THEN 'NULL'
               WHEN LENGTH(profile_picture) > 50 THEN CONCAT(LEFT(profile_picture, 50), '... (', LENGTH(profile_picture), ' chars total)')
               ELSE profile_picture
             END as picture_preview
      FROM students 
      ORDER BY created_at DESC 
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      console.log('No students found!');
    } else {
      const student = result.rows[0];
      console.log('Latest Student:');
      console.log(`  ID: ${student.student_id}`);
      console.log(`  Custom ID: ${student.student_custom_id}`);
      console.log(`  Name: ${student.name}`);
      console.log(`  Email: ${student.email}`);
      console.log(`  Institution: ${student.institution || '(NULL)'}`);
      console.log(`  Grade: ${student.grade || '(NULL)'}`);
      console.log(`  Profile Picture: ${student.picture_preview}`);
      console.log(`  Created: ${student.created_at}`);
      
      if (student.profile_picture) {
        console.log('\n✅ Profile picture data EXISTS in database!');
        console.log(`   Length: ${student.profile_picture.length} characters`);
        if (student.profile_picture.startsWith('data:image')) {
          console.log('   Format: Base64 image ✅');
        } else {
          console.log('   Format: Unknown (check if valid base64)');
        }
      } else {
        console.log('\n❌ Profile picture is NULL - student was created without image');
      }
    }

    client.release();
    await pool.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkLatestStudent();
