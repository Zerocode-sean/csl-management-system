"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClient = exports.query = exports.getPool = exports.closeDatabase = exports.connectDatabase = void 0;
const pg_1 = require("pg");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
let pool;
const connectDatabase = async () => {
    try {
        pool = new pg_1.Pool({
            host: config_1.config.database.host,
            port: config_1.config.database.port,
            user: config_1.config.database.user,
            password: config_1.config.database.password,
            database: config_1.config.database.database,
            ssl: config_1.config.database.ssl,
            max: config_1.config.database.max,
            idleTimeoutMillis: config_1.config.database.idleTimeoutMillis,
            connectionTimeoutMillis: config_1.config.database.connectionTimeoutMillis,
        });
        // Test connection
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
        client.release();
        logger_1.logger.info('PostgreSQL connected successfully', {
            timestamp: result.rows[0].current_time,
            version: result.rows[0].pg_version.split(' ')[0]
        });
        // Initialize database schema if needed
        await initializeSchema();
        // Handle pool errors
        pool.on('error', (err) => {
            logger_1.logger.error('Unexpected error on idle client', err);
        });
        // Handle process termination
        process.on('SIGINT', exports.closeDatabase);
        process.on('SIGTERM', exports.closeDatabase);
    }
    catch (error) {
        logger_1.logger.error('Failed to connect to PostgreSQL:', error);
        throw error;
    }
};
exports.connectDatabase = connectDatabase;
const initializeSchema = async () => {
    try {
        // Check if tables exist, create if not
        const checkTables = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'students', 'courses', 'certificates', 'audit_logs');
    `;
        const result = await (0, exports.query)(checkTables);
        const existingTables = result.rows.map((row) => row.table_name);
        if (existingTables.length === 0) {
            logger_1.logger.info('No tables found, database schema will be created when needed');
        }
        else {
            logger_1.logger.info('Existing database tables found:', existingTables);
        }
    }
    catch (error) {
        logger_1.logger.warn('Could not check database schema:', error);
    }
};
const closeDatabase = async () => {
    if (pool) {
        logger_1.logger.info('Closing database connection pool...');
        await pool.end();
        logger_1.logger.info('Database connection pool closed');
    }
};
exports.closeDatabase = closeDatabase;
const getPool = () => {
    if (!pool) {
        throw new Error('Database pool not initialized. Call connectDatabase() first.');
    }
    return pool;
};
exports.getPool = getPool;
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        logger_1.logger.debug('Executed query', { text, duration, rows: res.rowCount });
        return res;
    }
    catch (error) {
        logger_1.logger.error('Query error', { text, params, error });
        throw error;
    }
};
exports.query = query;
const getClient = async () => {
    return pool.connect();
};
exports.getClient = getClient;
