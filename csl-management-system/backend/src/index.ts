import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

console.log('=== BACKEND STARTING ===');
console.log('Step 1: Imports successful');

import swaggerUi from 'swagger-ui-express';
console.log('Step 2: swagger-ui-express imported');

import { specs } from './config/swagger';
console.log('Step 3: swagger specs imported');

import { errorHandler, notFoundHandler } from './middleware/errorHandler';
console.log('Step 4a: errorHandler imported');

import { rateLimiter } from './middleware/rateLimiter';
console.log('Step 4b: rateLimiter imported');

import { logger } from './utils/logger';
console.log('Step 4c: logger imported');

import { connectDatabase } from './database/connection';
console.log('Step 4d: connectDatabase imported');

// Routes will be imported dynamically in startServer() to allow
// catching and logging initialization errors from route modules.

// Load environment variables
dotenv.config();

console.log('Step 6: Environment loaded');

const app = express();
const PORT = process.env['PORT'] || 5000;
const API_PREFIX = process.env['API_PREFIX'] || '/api/v1';

// Security middleware
app.use(helmet({
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
app.use(cors({
  origin: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
app.use(rateLimiter);

// Logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
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
      await connectDatabase();
      logger.info('Database connected successfully');
    } catch (dbError) {
      logger.warn('Database connection failed, starting server without DB:', dbError);
    }

    // Dynamically import and attach route modules so we can catch initialization errors
    try {
      const [{ default: authRoutes }, { default: studentRoutes }, { default: courseRoutes }, { default: certificateRoutes }, { default: verificationRoutes }, { default: adminRoutes }, { default: auditRoutes }] = await Promise.all([
        import('./routes/auth'),
        import('./routes/students'),
        import('./routes/courses'),
        import('./routes/certificates'),
        import('./routes/verification'),
        import('./routes/admin'),
        import('./routes/audit')
      ]);

      app.use(`${API_PREFIX}/auth`, authRoutes);
      app.use(`${API_PREFIX}/students`, studentRoutes);
      app.use(`${API_PREFIX}/courses`, courseRoutes);
      app.use(`${API_PREFIX}/certificates`, certificateRoutes);
      app.use(`${API_PREFIX}/verification`, verificationRoutes);
      app.use(`${API_PREFIX}/admin`, adminRoutes);
      app.use(`${API_PREFIX}/audit`, auditRoutes);

      logger.info('All route modules loaded and attached');
    } catch (routeErr) {
      logger.error('Failed to load route modules:', routeErr);
      // Rethrow so startServer() fails and nodemon shows the full error
      throw routeErr;
    }

    // Error handlers (must be after routes)
    app.use(notFoundHandler);
    app.use(errorHandler);

    // Start listening
    const server = app.listen(PORT, () => {
      logger.info(`🚀 EMESA CSL Management System API running on port ${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
      logger.info(`🌍 Environment: ${process.env['NODE_ENV'] || 'development'}`);
    });

    server.on('error', (err) => {
      logger.error('Server error:', err);
      throw err;
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();

export default app;
