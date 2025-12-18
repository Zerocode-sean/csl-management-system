#!/usr/bin/env node

// Simple server startup without complex dependencies
console.log('🚀 Starting CSL Backend Server...\n');

const express = require('express');
const app = express();
const PORT = 5000;

// Basic middleware
app.use(express.json());

// Simple health endpoint
app.get('/health', (req, res) => {
  console.log('📡 Health check requested');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'CSL Backend is running',
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('📡 Root endpoint requested');
  res.json({
    message: 'CSL Management System API',
    status: 'running',
    endpoints: {
      health: '/health',
      docs: '/api-docs (not available in simple mode)'
    }
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`✅ Server started successfully!`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`📝 To test: Open URLs above in browser`);
  console.log(`⚡ Server is ready for requests\n`);
});

// Handle errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.log(`❌ Port ${PORT} is already in use`);
    console.log(`💡 Try killing existing processes or use a different port`);
  } else {
    console.log(`❌ Server error:`, error.message);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
