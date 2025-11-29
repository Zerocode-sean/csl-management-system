#!/usr/bin/env node

/**
 * Simple Backend Startup with Mock Data
 * For testing when Docker is not available
 */

console.log('🚀 CSL Backend - Emergency Mode');
console.log('===============================\n');

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock students data
const mockStudents = [
  {
    student_id: 1,
    name: "John Doe",
    email: "john.doe@email.com",
    mobile: "+1234567801",
    address: "123 Main St, City, State 12345",
    date_of_birth: "1995-05-15T00:00:00.000Z",
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
    date_of_birth: "1992-08-22T00:00:00.000Z",
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
    date_of_birth: "1998-03-10T00:00:00.000Z",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null
  },
  {
    student_id: 4,
    name: "Emily Brown",
    email: "emily.brown@email.com",
    mobile: "+1234567804",
    address: "321 Elm St, City, State 12348",
    date_of_birth: "1994-11-30T00:00:00.000Z",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null
  },
  {
    student_id: 5,
    name: "David Wilson",
    email: "david.w@email.com",
    mobile: "+1234567805",
    address: "654 Maple Dr, City, State 12349",
    date_of_birth: "1996-07-18T00:00:00.000Z",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null
  }
];

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'CSL Management System API - Emergency Mode',
    timestamp: new Date().toISOString(),
    version: 'Mock Data'
  });
});

app.get('/api/v1/students', (req, res) => {
  const { page = 1, limit = 10, search = '', status = '' } = req.query;
  
  let filteredStudents = mockStudents;
  
  // Apply search filter
  if (search) {
    filteredStudents = filteredStudents.filter(student =>
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.email.toLowerCase().includes(search.toLowerCase()) ||
      student.student_id.toString().includes(search)
    );
  }
  
  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: paginatedStudents,
    pagination: {
      total: filteredStudents.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(filteredStudents.length / limit)
    },
    source: 'mock-data'
  });
});

app.get('/api/v1/students/:id', (req, res) => {
  const { id } = req.params;
  const student = mockStudents.find(s => s.student_id == id);
  
  if (student) {
    res.json({
      success: true,
      data: student
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log('📊 Mock data mode - 5 sample students loaded');
  console.log('🌐 CORS enabled for frontend connections');
  console.log('\n💡 Test endpoints:');
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Students: http://localhost:${PORT}/api/v1/students`);
  console.log('\n🔄 To use real database:');
  console.log('   1. Start Docker Desktop');
  console.log('   2. Run: docker-compose up -d postgres');
  console.log('   3. Use: node database-production-server.js');
});

process.on('SIGINT', () => {
  console.log('\n👋 Backend server stopped');
  process.exit(0);
});
