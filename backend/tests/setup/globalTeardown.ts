import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

/**
 * Global teardown runs once after all tests
 * Drops the test database
 */
export default async () => {
  console.log('\n🧹 Global Test Teardown: Cleaning up test database...\n');

  // Connect to PostgreSQL server
  const teardownPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'csl_user',
    password: process.env.DB_PASSWORD,
    database: 'postgres', // Connect to default database
  });

  const testDbName = process.env.DB_NAME || 'csl_test_db';

  try {
    // Terminate all connections to the test database
    await teardownPool.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = '${testDbName}' AND pid <> pg_backend_pid()
    `);

    // Drop the test database
    await teardownPool.query(`DROP DATABASE IF EXISTS ${testDbName}`);
    console.log(`✓ Dropped test database: ${testDbName}`);
    console.log('✓ Cleanup complete!\n');
  } catch (error) {
    console.error('❌ Error cleaning up test database:', error);
    // Don't throw - we want tests to complete even if cleanup fails
  } finally {
    await teardownPool.end();
  }
};
