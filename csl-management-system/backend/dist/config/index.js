"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfig = exports.config = void 0;
exports.config = {
    // Server
    port: parseInt(process.env['PORT'] || '5000', 10),
    nodeEnv: process.env['NODE_ENV'] || 'development',
    apiPrefix: process.env['API_PREFIX'] || '/api/v1',
    // Database
    database: {
        host: process.env['DB_HOST'] || 'localhost',
        port: parseInt(process.env['DB_PORT'] || '5432', 10),
        user: process.env['DB_USER'] || 'csl_user',
        password: process.env['DB_PASSWORD'] || 'csl_password',
        database: process.env['DB_NAME'] || 'csl_database',
        ssl: process.env['NODE_ENV'] === 'production' ? { rejectUnauthorized: false } : false,
        max: parseInt(process.env['DB_POOL_MAX'] || '20', 10),
        idleTimeoutMillis: parseInt(process.env['DB_IDLE_TIMEOUT'] || '30000', 10),
        connectionTimeoutMillis: parseInt(process.env['DB_CONNECTION_TIMEOUT'] || '2000', 10),
    },
    // Redis
    redis: {
        host: process.env['REDIS_HOST'] || 'localhost',
        port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
        password: process.env['REDIS_PASSWORD'],
    },
    // JWT
    jwt: {
        secret: process.env['JWT_SECRET'] || 'your-super-secret-jwt-key-change-in-production',
        expiresIn: process.env['JWT_EXPIRES_IN'] || '7d',
        refreshSecret: process.env['JWT_REFRESH_SECRET'] || 'your-refresh-secret-key',
        refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '30d',
    },
    // Security
    security: {
        saltRounds: parseInt(process.env['SALT_ROUNDS'] || '12', 10),
        maxLoginAttempts: parseInt(process.env['MAX_LOGIN_ATTEMPTS'] || '3', 10),
        lockoutDuration: parseInt(process.env['LOCKOUT_DURATION'] || '30', 10), // minutes
        pepperKey: process.env['PEPPER_KEY'] || 'default-pepper-key-change-in-production',
    },
    // Rate limiting
    rateLimit: {
        windowMs: parseInt(process.env['RATE_LIMIT_WINDOW'] || '15', 10) * 60 * 1000, // 15 minutes
        maxRequests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100', 10),
        verificationWindowMs: 60 * 1000, // 1 minute for verification endpoint
        verificationMaxRequests: parseInt(process.env['VERIFICATION_RATE_LIMIT'] || '10', 10),
    },
    // CORS
    cors: {
        origin: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
    },
    // File upload
    upload: {
        maxFileSize: parseInt(process.env['MAX_FILE_SIZE'] || '10485760', 10), // 10MB
        uploadPath: process.env['UPLOAD_PATH'] || './uploads',
    },
    // Logging
    logging: {
        level: process.env['LOG_LEVEL'] || 'info',
        dir: process.env['LOG_DIR'] || './logs',
    },
    // CSL Generation
    csl: {
        pepperKey: process.env['CSL_PEPPER_KEY'] || 'csl-default-pepper-2025-change-me',
        hashLength: 6,
        yearDigits: 4,
        courseCodeLength: 2,
        sequentialDigits: 4,
    },
};
// Helper function to safely access environment variables
const getEnv = (key, defaultValue) => {
    return process.env[key] || defaultValue;
};
// Validate critical configuration
const validateConfig = () => {
    const requiredEnvVars = [
        'DB_PASSWORD',
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
    ];
    if (exports.config.nodeEnv === 'production') {
        requiredEnvVars.push('PEPPER_KEY', 'CSL_PEPPER_KEY');
    }
    const missingVars = requiredEnvVars.filter(varName => !getEnv(varName));
    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    // Validate JWT secret length
    if (exports.config.jwt.secret.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters long');
    }
    if (exports.config.jwt.refreshSecret.length < 32) {
        throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long');
    }
};
exports.validateConfig = validateConfig;
