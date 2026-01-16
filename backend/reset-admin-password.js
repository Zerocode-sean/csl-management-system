const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'csl_user',
  password: 'csl_password',
  database: 'csl_database'
});

const email = 'admin@csl.com';
const newPassword = 'Admin@2025';

(async () => {
  const hash = await bcrypt.hash(newPassword, 12);
  const res = await pool.query(
    'UPDATE admins SET password_hash = $1, failed_login_attempts = 0, account_locked_until = NULL WHERE email = $2 RETURNING admin_id',
    [hash, email]
  );
  if (res.rowCount > 0) {
    console.log('Admin password reset successful.');
  } else {
    console.log('Admin email not found.');
  }
  await pool.end();
})();
