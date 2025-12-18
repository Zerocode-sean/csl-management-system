const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.end();
    return;
  }
  
  if (req.url === '/health') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'OK', timestamp: new Date().toISOString() }));
    return;
  }
  
  if (req.url.startsWith('/api/v1/students')) {
    res.setHeader('Content-Type', 'application/json');
    
    // Parse URL for query parameters
    const url = new URL(req.url, `http://${req.headers.host}`);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    const mockStudents = [
      { 
        student_id: 1, 
        name: 'John Doe', 
        email: 'john@test.com', 
        mobile: '+1234567890',
        address: '123 Main St, City, State',
        date_of_birth: '1995-05-15',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        courses: 3,
        certificates: 2,
        status: 'active',
        institution: 'University of Technology'
      },
      { 
        student_id: 2, 
        name: 'Jane Smith', 
        email: 'jane@test.com', 
        mobile: '+0987654321',
        address: '456 Oak Ave, City, State',
        date_of_birth: '1992-08-22',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        courses: 5,
        certificates: 4,
        status: 'active',
        institution: 'State College'
      },
      { 
        student_id: 3, 
        name: 'Michael Johnson', 
        email: 'michael@test.com', 
        mobile: '+1122334455',
        address: '789 Pine Rd, City, State',
        date_of_birth: '1998-03-10',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        courses: 2,
        certificates: 1,
        status: 'active',
        institution: 'Community College'
      }
    ];
    
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
  
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(5001, () => {
  console.log('✅ Server running on http://localhost:5001');
  console.log('🔗 CORS enabled for http://localhost:3000');
});

server.on('error', (err) => {
  console.error('❌ Server error:', err.message);
});
