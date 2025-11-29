const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER || 'csl_user',
  password: process.env.DB_PASSWORD || 'csl_password',
  database: process.env.DB_NAME || 'csl_database'
});

(async () => {
  try {
    console.log('Inspecting courses table schema...');
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'courses';
    `);
    
    if (res.rows.length === 0) {
      console.log('Table "courses" not found!');
    } else {
      console.log('Columns in courses table:');
      res.rows.forEach(row => {
        console.log(`- ${row.column_name} (${row.data_type})`);
      });
    }
  } catch (err) {
    console.error('Error inspecting schema:', err);
  } finally {
    await pool.end();
  }
})();
