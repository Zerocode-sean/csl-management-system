import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';
import { connectDatabase } from './database/connection';

// Routes
import authRoutes from './routes/auth';
import studentRoutes from './routes/students';
import courseRoutes from './routes/courses';
import certificateRoutes from './routes/certificates';
import verificationRoutes from './routes/verification';
import adminRoutes from './routes/admin';
import auditRoutes from './routes/audit';
import publicRoutes from './routes/public';
import settingsRoutes from './routes/settings';

// Load environment variables
dotenv.config();

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

// API Routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/students`, studentRoutes);
app.use(`${API_PREFIX}/courses`, courseRoutes);
app.use(`${API_PREFIX}/certificates`, certificateRoutes);
app.use(`${API_PREFIX}/verification`, verificationRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/audit`, auditRoutes);
app.use(`${API_PREFIX}/settings`, settingsRoutes);
app.use(`${API_PREFIX}/public`, publicRoutes); // Public routes (no auth required)

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
app.use(notFoundHandler);
app.use(errorHandler);

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

    // Start listening
    app.listen(PORT, () => {
      logger.info(`🚀 EMESA CSL Management System API running on port ${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
      logger.info(`🌍 Environment: ${process.env['NODE_ENV'] || 'development'}`);
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
