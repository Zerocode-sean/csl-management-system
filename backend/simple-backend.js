#!/usr/bin/env node

/**
 * Ultra Simple Backend Server for CSL
 */

const http = require('http');
const url = require('url');

const PORT = 5001;

// Mock students data
const students = [
  {
    student_id: 1,
    name: "John Doe",
    email: "john.doe@email.com",
    mobile: "+1234567801",
    address: "123 Main St, City, State 12345",
    date_of_birth: "1995-05-15",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null
  },
  {
    student_id: 2,
    name: "Jane Smith",
    email: "jane.smith@email.com",
    mobile: "+1234567802",
    address: "456 Oak Ave, City, State 12346",
    date_of_birth: "1992-08-22",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null
  },
  {
    student_id: 3,
    name: "Michael Johnson",
    email: "michael.j@email.com",
    mobile: "+1234567803",
    address: "789 Pine Rd, City, State 12347",
    date_of_birth: "1998-03-10",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null
  }
];

// CORS headers - Updated to specifically allow frontend origins
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Origin',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  console.log(`${method} ${path} - Origin: ${req.headers.origin || 'none'}`);

  // Enhanced CORS handling
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://localhost:5173', 
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight OPTIONS request
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    if (path === '/health' && method === 'GET') {
      // Health check
      const response = {
        status: 'healthy',
        message: 'CSL Management System API - Simple Mode',
        timestamp: new Date().toISOString(),
        version: 'Simple Backend v1.0'
      };
      
      res.writeHead(200);
      res.end(JSON.stringify(response, null, 2));

    } else if (path === '/api/v1/students' && method === 'GET') {
      // Students list
      const { page = 1, limit = 10, search = '' } = parsedUrl.query;
      
      let filteredStudents = students;
      
      // Apply search filter
      if (search) {
        filteredStudents = students.filter(student =>
          student.name.toLowerCase().includes(search.toLowerCase()) ||
          student.email.toLowerCase().includes(search.toLowerCase()) ||
          student.student_id.toString().includes(search)
        );
      }
      
      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedStudents = filteredStudents.slice(startIndex, endIndex);
      
      const response = {
        success: true,
        data: paginatedStudents,
        pagination: {
          total: filteredStudents.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(filteredStudents.length / limit)
        },
        source: 'simple-backend'
      };
      
      res.writeHead(200);
      res.end(JSON.stringify(response, null, 2));

    } else if (path.startsWith('/api/v1/students/') && method === 'GET') {
      // Single student
      const id = parseInt(path.split('/')[4]);
      const student = students.find(s => s.student_id === id);
      
      if (student) {
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          data: student
        }, null, 2));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({
          success: false,
          message: 'Student not found'
        }));
      }

    } else {
      // 404 Not Found
      res.writeHead(404);
      res.end(JSON.stringify({
        success: false,
        message: 'Endpoint not found',
        path: path
      }));
    }

  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({
      success: false,
      message: 'Internal server error',
      error: error.message
    }));
  }
});

server.listen(PORT, () => {
  console.log('🚀 CSL Simple Backend Server');
  console.log('============================');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Loaded ${students.length} mock students`);
  console.log('🌐 CORS enabled for all origins');
  console.log('\n💡 Available endpoints:');
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/students`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/students/:id`);
  console.log('\n🎯 Ready for frontend connections!');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.log('💡 Try: netstat -ano | findstr :5001');
    console.log('💡 Or change PORT in this file');
  } else {
    console.error('❌ Server error:', error);
  }
});

process.on('SIGINT', () => {
  console.log('\n👋 Server shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
