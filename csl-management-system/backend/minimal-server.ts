import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 5000;

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Logging
app.use(morgan('combined'));

// Simple health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env['NODE_ENV'] || 'development'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'CSL Management System API',
    version: '1.0.0',
    status: 'running'
  });
});

// Start server without database
app.listen(PORT, () => {
  console.log(`🚀 CSL Management System API running on port ${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env['NODE_ENV'] || 'development'}`);
});

export default app;
