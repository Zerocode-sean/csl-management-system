#!/usr/bin/env node

/**
 * Frontend-Ready Backend Server for CSL Management System
 * Specifically configured for React frontend on localhost:3000
 */

const http = require('http');
const url = require('url');

const PORT = 5001;

// Enhanced mock students data
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
  },
  {
    student_id: 4,
    name: "Sarah Williams",
    email: "sarah.w@email.com",
    mobile: "+1234567804",
    address: "321 Elm St, City, State 12348",
    date_of_birth: "1996-11-28",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null
  },
  {
    student_id: 5,
    name: "David Brown",
    email: "david.brown@email.com",
    mobile: "+1234567805",
    address: "654 Cedar Ave, City, State 12349",
    date_of_birth: "1994-07-14",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null
  }
];

/**
 * Set CORS headers for frontend integration
 */
function setCORSHeaders(res, origin) {
  // Always allow localhost:3000 (React frontend)
  if (origin === 'http://localhost:3000') {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  } else {
    // Allow other common development ports
    const allowedOrigins = [
      'http://localhost:3001',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ];
    
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;
  const origin = req.headers.origin;

  console.log(`\n[${new Date().toISOString()}] ${method} ${path}`);
  console.log(`Origin: ${origin || 'none'}`);
  console.log(`User-Agent: ${req.headers['user-agent'] || 'none'}`);

  // Set CORS headers for all requests
  setCORSHeaders(res, origin);

  // Handle preflight OPTIONS requests
  if (method === 'OPTIONS') {
    console.log('Handling preflight request');
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // Health check endpoint
    if (path === '/health' && method === 'GET') {
      const response = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server: 'Frontend-Ready Backend',
        port: PORT
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
      return;
    }

    // Students API endpoints
    if (path === '/api/v1/students' && method === 'GET') {
      const query = parsedUrl.query;
      let filteredStudents = students.filter(s => !s.deleted_at);
      
      // Search functionality
      if (query.search) {
        const searchTerm = query.search.toLowerCase();
        filteredStudents = filteredStudents.filter(student => 
          student.name.toLowerCase().includes(searchTerm) ||
          student.email.toLowerCase().includes(searchTerm) ||
          student.mobile.includes(searchTerm)
        );
      }
      
      // Pagination
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 10;
      const offset = (page - 1) * limit;
      
      const totalStudents = filteredStudents.length;
      const paginatedStudents = filteredStudents.slice(offset, offset + limit);
      
      const response = {
        success: true,
        data: paginatedStudents,
        pagination: {
          page: page,
          limit: limit,
          total: totalStudents,
          totalPages: Math.ceil(totalStudents / limit)
        },
        timestamp: new Date().toISOString()
      };
      
      console.log(`Returning ${paginatedStudents.length} students (page ${page})`);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
      return;
    }

    // Get student by ID
    if (path.startsWith('/api/v1/students/') && method === 'GET') {
      const studentId = parseInt(path.split('/')[4]);
      const student = students.find(s => s.student_id === studentId && !s.deleted_at);
      
      if (student) {
        const response = {
          success: true,
          data: student,
          timestamp: new Date().toISOString()
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
      } else {
        const response = {
          success: false,
          error: 'Student not found',
          timestamp: new Date().toISOString()
        };
        
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
      }
      return;
    }

    // Root endpoint
    if (path === '/' && method === 'GET') {
      const response = {
        message: 'CSL Management System Backend',
        version: '1.0.0',
        status: 'running',
        endpoints: {
          health: '/health',
          students: '/api/v1/students',
          studentById: '/api/v1/students/:id'
        },
        timestamp: new Date().toISOString()
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
      return;
    }

    // 404 Not Found
    console.log(`404: ${method} ${path} not found`);
    const response = {
      success: false,
      error: 'Endpoint not found',
      path: path,
      method: method,
      timestamp: new Date().toISOString()
    };
    
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response, null, 2));

  } catch (error) {
    console.error('Server error:', error);
    
    const response = {
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    };
    
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response, null, 2));
  }
});

// Start the server
server.listen(PORT, () => {
  console.log('\n🚀 Frontend-Ready Backend Server Started');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log('🌐 CORS enabled for React frontend on localhost:3000');
  console.log('📋 Available endpoints:');
  console.log('   GET  /health');
  console.log('   GET  /api/v1/students');
  console.log('   GET  /api/v1/students/:id');
  console.log('\nPress Ctrl+C to stop the server\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Shutting down backend server...');
  server.close(() => {
    console.log('✅ Server stopped successfully');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Received SIGTERM, shutting down...');
  server.close(() => {
    console.log('✅ Server stopped successfully');
    process.exit(0);
  });
});
