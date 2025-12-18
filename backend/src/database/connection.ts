import { Pool, PoolClient } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';

let pool: Pool;

export const connectDatabase = async (): Promise<void> => {
  try {
    pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      ssl: config.database.ssl,
      max: config.database.max,
      idleTimeoutMillis: config.database.idleTimeoutMillis,
      connectionTimeoutMillis: config.database.connectionTimeoutMillis,
    });

    // Test connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    client.release();
    
    logger.info('PostgreSQL connected successfully', {
      timestamp: result.rows[0].current_time,
      version: result.rows[0].pg_version.split(' ')[0]
    });

    // Initialize database schema if needed
    await initializeSchema();

    // Handle pool errors
    pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });

    // Handle process termination
    process.on('SIGINT', closeDatabase);
    process.on('SIGTERM', closeDatabase);

  } catch (error) {
    logger.error('Failed to connect to PostgreSQL:', error);
    throw error;
  }
};

const initializeSchema = async (): Promise<void> => {
  try {
    // Check if tables exist, create if not
    const checkTables = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'students', 'courses', 'certificates', 'audit_logs');
    `;
    
    const result = await query(checkTables);
    const existingTables = result.rows.map((row: any) => row.table_name);
    
    if (existingTables.length === 0) {
      logger.info('No tables found, database schema will be created when needed');
    } else {
      logger.info('Existing database tables found:', existingTables);
    }
  } catch (error) {
    logger.warn('Could not check database schema:', error);
  }
};

export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    logger.info('Closing database connection pool...');
    await pool.end();
    logger.info('Database connection pool closed');
  }
};

export const getPool = (): Pool => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call connectDatabase() first.');
  }
  return pool;
};

export const query = async (text: string, params?: any[]): Promise<any> => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Query error', { text, params, error });
    throw error;
  }
};

export const getClient = async (): Promise<PoolClient> => {
  return pool.connect();
};
