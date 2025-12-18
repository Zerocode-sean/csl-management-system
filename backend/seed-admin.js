const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

require('dotenv').config({ path: './.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER || 'csl_user',
  password: process.env.DB_PASSWORD || 'csl_password',
  database: process.env.DB_NAME || 'csl_database'
});


// Default admin user
const usersToSeed = [
  {
    username: 'admin',
    email: 'admin@csl.com',
    password: 'Admin@2025',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User'
  },
  {
    username: 'sean',
    email: 'sean@gmail.com',
    password: 'sean001',
    role: 'admin',
    firstName: 'Sean',
    lastName: 'Dev'
  }
];
const saltRounds = process.env.SALT_ROUNDS ? parseInt(process.env.SALT_ROUNDS) : 12;

(async () => {
  try {
    // Delete all admins
    await pool.query('DELETE FROM admins');
    for (const user of usersToSeed) {
      const hash = await bcrypt.hash(user.password, saltRounds);
      await pool.query(
        `INSERT INTO admins (username, email, password_hash, role, is_active, failed_login_attempts, account_locked_until, first_name, last_name)
         VALUES ($1, $2, $3, $4, true, 0, NULL, $5, $6)`,
        [user.username, user.email, hash, user.role, user.firstName, user.lastName]
      );
      console.log(`Seeded admin: ${user.email}`);
    }
  } catch (err) {
    console.error('Error seeding admin:', err);
  } finally {
    await pool.end();
  }
})();