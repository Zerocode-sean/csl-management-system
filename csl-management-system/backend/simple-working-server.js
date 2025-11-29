const http = require('http');
const url = require('url');

const PORT = 5001;

// Mock students data
const mockStudents = [
  {
    student_id: 1,
    name: "John Doe",
    email: "john.doe@email.com",
    mobile: "+1234567890",
    address: "123 Main St, City, State 12345",
    date_of_birth: "1995-05-15",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    courses: 3,
    certificates: 2,
    status: "active",
    institution: "University of Technology"
  },
  {
    student_id: 2,
    name: "Jane Smith",
    email: "jane.smith@email.com",
    mobile: "+0987654321",
    address: "456 Oak Ave, City, State 12346",
    date_of_birth: "1992-08-22",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    courses: 5,
    certificates: 4,
    status: "active",
    institution: "State College"
  },
  {
    student_id: 3,
    name: "Michael Johnson",
    email: "michael.j@email.com",
    mobile: "+1122334455",
    address: "789 Pine Rd, City, State 12347",
    date_of_birth: "1998-03-10",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    courses: 2,
    certificates: 1,
    status: "active",
    institution: "Community College"
  }
];

function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname: path, query } = parsedUrl;
  const method = req.method;

  console.log(`${method} ${path}`);

  // Set CORS headers for all requests
  setCORSHeaders(res);

  // Handle preflight OPTIONS requests
  if (method === 'OPTIONS') {
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
      port: PORT
    }));
    return;
  }

  // Students API
  if (path === '/api/v1/students' && method === 'GET') {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: mockStudents,
      pagination: {
        page: page,
        limit: limit,
        total: mockStudents.length,
        totalPages: Math.ceil(mockStudents.length / limit)
      }
    }));
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found', path: path }));
});

server.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`🔗 CORS enabled for all origins`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET /health`);
  console.log(`   GET /api/v1/students`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
  }
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
