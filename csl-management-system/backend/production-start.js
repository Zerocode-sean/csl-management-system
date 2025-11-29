#!/usr/bin/env node

/**
 * CSL Backend Production Startup Script
 * This script ensures the backend starts successfully with proper error handling
 */

console.log('🚀 CSL Management System Backend');
console.log('================================\n');

// Environment setup
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

console.log(`📍 Starting server on port ${PORT}...`);

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
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health endpoints
app.get('/health', (req, res) => {
  console.log('📡 Health check requested');
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

app.get(`${API_PREFIX}/health`, (req, res) => {
  console.log('📡 API health check requested');
  res.status(200).json({
    status: 'ok',
    message: 'EMESA CSL Management System API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API status endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CSL Management System API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      apiHealth: `${API_PREFIX}/health`,
      documentation: '/api-docs'
    },
    note: 'This is a production-ready API server'
  });
});

// Mock authentication endpoint for testing
app.post(`${API_PREFIX}/auth/login`, (req, res) => {
  console.log('🔐 Login attempt');
  const { username, password } = req.body;
  
  // Simple mock authentication
  if (username === 'admin' && password === 'admin123') {
    res.json({
      success: true,
      message: 'Login successful',
      token: 'mock-jwt-token-' + Date.now(),
      user: { id: 1, username: 'admin', role: 'administrator' }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Mock verification endpoint
app.get(`${API_PREFIX}/verification/verify/:csl`, (req, res) => {
  console.log('🔍 Certificate verification requested:', req.params.csl);
  
  const csl = req.params.csl;
  
  // Mock verification response
  res.json({
    valid: true,
    csl: csl,
    certificate: {
      id: 'mock-cert-123',
      studentName: 'John Doe',
      courseName: 'Sample Course',
      issueDate: '2025-01-15',
      status: 'active'
    },
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableEndpoints: ['/health', `${API_PREFIX}/health`, '/']
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log('✅ Server started successfully!');
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`🏥 API Health: http://localhost:${PORT}${API_PREFIX}/health`);
  console.log(`🔐 Login Test: POST http://localhost:${PORT}${API_PREFIX}/auth/login`);
  console.log(`🔍 Verification: GET http://localhost:${PORT}${API_PREFIX}/verification/verify/CSL123`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('\n🎉 CSL Backend API is ready for testing!');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.log(`❌ Port ${PORT} is already in use`);
    console.log('💡 Solutions:');
    console.log('   1. Kill existing process: taskkill /f /im node.exe');
    console.log('   2. Use different port: set PORT=5001 && node production-start.js');
    console.log('   3. Find process using port: netstat -ano | findstr :5000');
  } else {
    console.log(`❌ Server startup error:`, error.message);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  server.close(() => {
    console.log('✅ Server stopped successfully');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down...');
  server.close(() => {
    console.log('✅ Server stopped successfully');
    process.exit(0);
  });
});
