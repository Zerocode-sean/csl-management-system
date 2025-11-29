"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./config/swagger");
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const logger_1 = require("./utils/logger");
const connection_1 = require("./database/connection");
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const students_1 = __importDefault(require("./routes/students"));
const courses_1 = __importDefault(require("./routes/courses"));
const certificates_1 = __importDefault(require("./routes/certificates"));
const verification_1 = __importDefault(require("./routes/verification"));
const admin_1 = __importDefault(require("./routes/admin"));
const audit_1 = __importDefault(require("./routes/audit"));
// Load environment variables
dotenv_1.default.config();
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
// API Routes
app.use(`${API_PREFIX}/auth`, auth_1.default);
app.use(`${API_PREFIX}/students`, students_1.default);
app.use(`${API_PREFIX}/courses`, courses_1.default);
app.use(`${API_PREFIX}/certificates`, certificates_1.default);
app.use(`${API_PREFIX}/verification`, verification_1.default);
app.use(`${API_PREFIX}/admin`, admin_1.default);
app.use(`${API_PREFIX}/audit`, audit_1.default);
// Health check with API prefix
app.get(`${API_PREFIX}/health`, (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: ' EMESA CSL Management System API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
// Error handlers
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
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
        // Start listening
        app.listen(PORT, () => {
            logger_1.logger.info(`🚀 EMESA CSL Management System API running on port ${PORT}`);
            logger_1.logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
            logger_1.logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
            logger_1.logger.info(`🌍 Environment: ${process.env['NODE_ENV'] || 'development'}`);
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
