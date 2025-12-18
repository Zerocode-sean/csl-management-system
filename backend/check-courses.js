
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'csl_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function checkCourses() {
  try {
    const res = await pool.query('SELECT course_id, code, title, is_active FROM courses WHERE is_active = true');
    console.log('Active Courses Count:', res.rowCount);
    console.log('Courses:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error querying courses:', err);
  } finally {
    await pool.end();
  }
}

checkCourses();
