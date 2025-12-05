"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
console.log('=== BACKEND STARTING ===');
console.log('Step 1: Imports successful');
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
console.log('Step 2: swagger-ui-express imported');
const swagger_1 = require("./config/swagger");
console.log('Step 3: swagger specs imported');
const errorHandler_1 = require("./middleware/errorHandler");
console.log('Step 4a: errorHandler imported');
const rateLimiter_1 = require("./middleware/rateLimiter");
console.log('Step 4b: rateLimiter imported');
const logger_1 = require("./utils/logger");
console.log('Step 4c: logger imported');
const connection_1 = require("./database/connection");
console.log('Step 4d: connectDatabase imported');
// Routes will be imported dynamically in startServer() to allow
// catching and logging initialization errors from route modules.
// Load environment variables
dotenv_1.default.config();
console.log('Step 6: Environment loaded');
const app = (0, express_1.default)();
const PORT = process.env['PORT'] || 5000;
const API_PREFIX = process.env['API_PREFIX'] || '/api/v1';
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
// Rate limiting
app.use(rateLimiter_1.rateLimiter);
// Logging
app.use((0, morgan_1.default)('combined', {
    stream: {
        write: (message) => logger_1.logger.info(message.trim())
    }
}));
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env['NODE_ENV'] || 'development'
    });
});
// API Documentation
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'CSL Management System API'
}));
// API Routes will be attached after dynamic import inside startServer()
// Health check with API prefix
app.get(`${API_PREFIX}/health`, (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: ' EMESA CSL Management System API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
// Start server
const startServer = async () => {
    try {
        // Try to connect to database (optional in development)
        try {
            await (0, connection_1.connectDatabase)();
            logger_1.logger.info('Database connected successfully');
        }
        catch (dbError) {
            logger_1.logger.warn('Database connection failed, starting server without DB:', dbError);
        }
        // Dynamically import and attach route modules so we can catch initialization errors
        try {
            const [{ default: authRoutes }, { default: studentRoutes }, { default: courseRoutes }, { default: certificateRoutes }, { default: verificationRoutes }, { default: adminRoutes }, { default: auditRoutes }] = await Promise.all([
                Promise.resolve().then(() => __importStar(require('./routes/auth'))),
                Promise.resolve().then(() => __importStar(require('./routes/students'))),
                Promise.resolve().then(() => __importStar(require('./routes/courses'))),
                Promise.resolve().then(() => __importStar(require('./routes/certificates'))),
                Promise.resolve().then(() => __importStar(require('./routes/verification'))),
                Promise.resolve().then(() => __importStar(require('./routes/admin'))),
                Promise.resolve().then(() => __importStar(require('./routes/audit')))
            ]);
            app.use(`${API_PREFIX}/auth`, authRoutes);
            app.use(`${API_PREFIX}/students`, studentRoutes);
            app.use(`${API_PREFIX}/courses`, courseRoutes);
            app.use(`${API_PREFIX}/certificates`, certificateRoutes);
            app.use(`${API_PREFIX}/verification`, verificationRoutes);
            app.use(`${API_PREFIX}/admin`, adminRoutes);
            app.use(`${API_PREFIX}/audit`, auditRoutes);
            logger_1.logger.info('All route modules loaded and attached');
        }
        catch (routeErr) {
            logger_1.logger.error('Failed to load route modules:', routeErr);
            // Rethrow so startServer() fails and nodemon shows the full error
            throw routeErr;
        }
        // Error handlers (must be after routes)
        app.use(errorHandler_1.notFoundHandler);
        app.use(errorHandler_1.errorHandler);
        // Start listening
        const server = app.listen(PORT, () => {
            logger_1.logger.info(`🚀 EMESA CSL Management System API running on port ${PORT}`);
            logger_1.logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
            logger_1.logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
            logger_1.logger.info(`🌍 Environment: ${process.env['NODE_ENV'] || 'development'}`);
        });
        server.on('error', (err) => {
            logger_1.logger.error('Server error:', err);
            throw err;
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
// Graceful shutdown
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});
// Start the server
startServer();
exports.default = app;
