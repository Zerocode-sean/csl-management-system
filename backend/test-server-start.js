#!/usr/bin/env node

/**
 * Test Server Startup - Simplified version to verify backend works
 */

const http = require('http');

const PORT = 5001;

// Simple CORS middleware
function setCORSHeaders(res, origin) {
  console.log('Setting CORS for origin:', origin);
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;
  const origin = req.headers.origin;

  console.log(`${method} ${path} (Origin: ${origin})`);

  // Set CORS headers for all requests
  setCORSHeaders(res, origin);

  // Handle preflight OPTIONS requests
  if (method === 'OPTIONS') {
    console.log('✅ Preflight request handled');
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check
  if (path === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      cors: 'enabled'
    }));
    return;
  }

  // Students endpoint
  if (path === '/api/students' && method === 'GET') {
    const mockStudents = [
      { 
        student_id: 1, 
        name: "John Doe", 
        email: "john@test.com", 
        mobile: "+1234567890" 
      },
      { 
        student_id: 2, 
        name: "Jane Smith", 
        email: "jane@test.com", 
        mobile: "+0987654321" 
      }
    ];

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: mockStudents,
      total: mockStudents.length
    }));
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log('🚀 Test Backend Server Started Successfully!');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🔗 CORS enabled for http://localhost:3000`);
  console.log('📋 Available endpoints:');
  console.log('   GET /health - Health check');
  console.log('   GET /api/students - Students data');
  console.log('\n⏱️  Server is ready to receive requests...\n');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Error: Port ${PORT} is already in use`);
    console.log('🔍 Run this command to check what\'s using the port:');
    console.log(`   netstat -ano | findstr :${PORT}`);
  } else {
    console.error('❌ Server error:', err.message);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server shutdown complete');
    process.exit(0);
  });
});
