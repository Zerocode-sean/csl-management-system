#!/usr/bin/env node

/**
 * CSL Backend Production Server with Real PostgreSQL Database
 * Version 3.0 - Enhanced with real database integration
 */

console.log('🚀 CSL Management System Backend v3.0 - Real Database');
console.log('====================================================\n');

// Environment setup
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');

// Database connection setup
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'csl_user',
  password: process.env.DB_PASSWORD || 'csl_password',
  database: process.env.DB_NAME || 'csl_database',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Database connection test
async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    client.release();
    
    console.log('✅ Database connected successfully!');
    console.log(`   Timestamp: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL Version: ${result.rows[0].pg_version.split(' ')[0]}`);
    
    // Check if tables exist
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`✅ Found ${tableCheck.rows.length} tables:`);
    tableCheck.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    return true;
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    console.log('⚠️  Falling back to mock data for development...');
    return false;
  }
}

// Database repository functions
const DatabaseRepository = {
  async getStudents(limit = 10, offset = 0, search = '') {
    const searchQuery = search ? 
      `WHERE name ILIKE $3 OR email ILIKE $3 OR student_id::text ILIKE $3` : '';
    
    const query = `
      SELECT student_id, name, email, mobile, address, date_of_birth, 
             created_at, updated_at, deleted_at
      FROM students 
      ${searchQuery}
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    
    const params = search ? [limit, offset, `%${search}%`] : [limit, offset];
    const result = await pool.query(query, params);
    
    // Get total count
    const countQuery = `SELECT COUNT(*) FROM students ${searchQuery}`;
    const countParams = search ? [`%${search}%`] : [];
    const countResult = await pool.query(countQuery, countParams);
    
    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    };
  },

  async getStudentById(id) {
    const result = await pool.query('SELECT * FROM students WHERE student_id = $1', [id]);
    return result.rows[0];
  },

  async createStudent(studentData) {
    const { name, email, mobile, date_of_birth, address } = studentData;
    const result = await pool.query(
      `INSERT INTO students (name, email, mobile, date_of_birth, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, email, mobile, date_of_birth, address]
    );
    return result.rows[0];
  },

  async updateStudent(id, studentData) {
    const { name, email, mobile, date_of_birth, address } = studentData;
    const result = await pool.query(
      `UPDATE students 
       SET name = $1, email = $2, mobile = $3, 
           date_of_birth = $4, address = $5, updated_at = NOW()
       WHERE student_id = $6
       RETURNING *`,
      [name, email, mobile, date_of_birth, address, id]
    );
    return result.rows[0];
  },

  async deleteStudent(id) {
    const result = await pool.query('DELETE FROM students WHERE student_id = $1 RETURNING *', [id]);
    return result.rows[0];
  },

  async getCourses(limit = 10, offset = 0) {
    const result = await pool.query(
      `SELECT id, course_code, course_name, description, category, credits, 
              duration_weeks, is_active, created_at, updated_at
       FROM courses 
       WHERE is_active = true
       ORDER BY course_code 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    const countResult = await pool.query('SELECT COUNT(*) FROM courses WHERE is_active = true');
    
    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    };
  },

  async getCourseById(id) {
    const result = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
    return result.rows[0];
  },

  async createCourse(courseData) {
    const { course_code, course_name, description, category, credits, duration_weeks } = courseData;
    const result = await pool.query(
      `INSERT INTO courses (course_code, course_name, description, category, credits, duration_weeks, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [course_code, course_name, description, category, credits, duration_weeks]
    );
    return result.rows[0];
  },

  async getCertificates(limit = 10, offset = 0) {
    const result = await pool.query(
      `SELECT c.id, c.certificate_id, c.student_id, c.course_id, c.issue_date,
              c.expiry_date, c.status, c.verification_code, c.created_at,
              s.first_name, s.last_name, s.email,
              co.course_code, co.course_name
       FROM certificates c
       JOIN students s ON c.student_id = s.id
       JOIN courses co ON c.course_id = co.id
       ORDER BY c.issue_date DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    const countResult = await pool.query('SELECT COUNT(*) FROM certificates');
    
    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    };
  },

  async createCertificate(certData) {
    const { certificate_id, student_id, course_id, issue_date, expiry_date, verification_code } = certData;
    const result = await pool.query(
      `INSERT INTO certificates (certificate_id, student_id, course_id, issue_date, expiry_date, verification_code, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active')
       RETURNING *`,
      [certificate_id, student_id, course_id, issue_date, expiry_date, verification_code]
    );
    return result.rows[0];
  },

  async verifyCertificate(verificationCode) {
    const result = await pool.query(
      `SELECT c.*, s.first_name, s.last_name, s.email, co.course_code, co.course_name
       FROM certificates c
       JOIN students s ON c.student_id = s.id
       JOIN courses co ON c.course_id = co.id
       WHERE c.verification_code = $1 AND c.status = 'active'`,
      [verificationCode]
    );
    return result.rows[0];
  }
};

// Mock data fallback (same as before)
const mockData = {
  students: [
    { id: 1, student_id: 'CSL2025001', first_name: 'Alice', last_name: 'Johnson', email: 'alice@example.com', status: 'active', created_at: new Date() },
    { id: 2, student_id: 'CSL2025002', first_name: 'Bob', last_name: 'Smith', email: 'bob@example.com', status: 'active', created_at: new Date() },
    { id: 3, student_id: 'CSL2025003', first_name: 'Carol', last_name: 'Davis', email: 'carol@example.com', status: 'graduated', created_at: new Date() }
  ],
  courses: [
    { id: 1, course_code: 'CS101', course_name: 'Introduction to Computer Science', category: 'Computer Science', credits: 3, is_active: true },
    { id: 2, course_code: 'WEB201', course_name: 'Web Development Fundamentals', category: 'Web Development', credits: 4, is_active: true },
    { id: 3, course_code: 'DATA301', course_name: 'Data Analysis', category: 'Data Science', credits: 3, is_active: true }
  ],
  certificates: [
    { id: 1, certificate_id: 'CSL-CERT-001', student_id: 1, course_id: 1, verification_code: 'CSL-2025-001', status: 'active', issue_date: new Date() },
    { id: 2, certificate_id: 'CSL-CERT-002', student_id: 2, course_id: 2, verification_code: 'CSL-2025-002', status: 'active', issue_date: new Date() },
    { id: 3, certificate_id: 'CSL-CERT-003', student_id: 3, course_id: 3, verification_code: 'CSL-2025-003', status: 'active', issue_date: new Date() }
  ]
};

// Create Express app
const app = express();
const PORT = process.env.PORT || 5001;
const API_PREFIX = process.env.API_PREFIX || '/api';

// Global variable to track database availability
let isDatabaseConnected = false;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbInfo = null;
  
  if (isDatabaseConnected) {
    try {
      const result = await pool.query('SELECT NOW() as timestamp, version() as version');
      dbStatus = 'connected';
      dbInfo = {
        timestamp: result.rows[0].timestamp,
        version: result.rows[0].version.split(' ')[0]
      };
    } catch (error) {
      dbStatus = 'error';
      dbInfo = { error: error.message };
    }
  }
  
  res.json({
    status: 'healthy',
    message: 'CSL Management System API v3.0 with Real Database',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      type: 'PostgreSQL',
      info: dbInfo
    }
  });
});

// API Routes with database integration
app.get(`${API_PREFIX}/students`, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let result;
    if (isDatabaseConnected) {
      result = await DatabaseRepository.getStudents(parseInt(limit), offset, search);
    } else {
      // Mock data fallback
      const filtered = search ? 
        mockData.students.filter(s => 
          s.first_name.toLowerCase().includes(search.toLowerCase()) ||
          s.last_name.toLowerCase().includes(search.toLowerCase()) ||
          s.email.toLowerCase().includes(search.toLowerCase())
        ) : mockData.students;
      
      result = {
        data: filtered.slice(offset, offset + parseInt(limit)),
        total: filtered.length,
        limit: parseInt(limit),
        offset
      };
    }
    
    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(result.total / limit)
      },
      source: isDatabaseConnected ? 'database' : 'mock'
    });
  } catch (error) {
    console.error('Students API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: error.message
    });
  }
});

app.get(`${API_PREFIX}/students/:id`, async (req, res) => {
  try {
    const { id } = req.params;
    
    let student;
    if (isDatabaseConnected) {
      student = await DatabaseRepository.getStudentById(id);
    } else {
      student = mockData.students.find(s => s.id == id);
    }
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    res.json({
      success: true,
      data: student,
      source: isDatabaseConnected ? 'database' : 'mock'
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student',
      error: error.message
    });
  }
});

app.post(`${API_PREFIX}/students`, async (req, res) => {
  try {
    const studentData = req.body;
    
    // Basic validation
    if (!studentData.student_id || !studentData.first_name || !studentData.last_name || !studentData.email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: student_id, first_name, last_name, email'
      });
    }
    
    let newStudent;
    if (isDatabaseConnected) {
      newStudent = await DatabaseRepository.createStudent(studentData);
    } else {
      newStudent = {
        id: mockData.students.length + 1,
        ...studentData,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      };
      mockData.students.push(newStudent);
    }
    
    res.status(201).json({
      success: true,
      data: newStudent,
      message: 'Student created successfully',
      source: isDatabaseConnected ? 'database' : 'mock'
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create student',
      error: error.message
    });
  }
});

// Continue with other routes...
app.get(`${API_PREFIX}/courses`, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let result;
    if (isDatabaseConnected) {
      result = await DatabaseRepository.getCourses(parseInt(limit), offset);
    } else {
      result = {
        data: mockData.courses.slice(offset, offset + parseInt(limit)),
        total: mockData.courses.length,
        limit: parseInt(limit),
        offset
      };
    }
    
    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(result.total / limit)
      },
      source: isDatabaseConnected ? 'database' : 'mock'
    });
  } catch (error) {
    console.error('Courses API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: error.message
    });
  }
});

app.get(`${API_PREFIX}/certificates`, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let result;
    if (isDatabaseConnected) {
      result = await DatabaseRepository.getCertificates(parseInt(limit), offset);
    } else {
      result = {
        data: mockData.certificates.slice(offset, offset + parseInt(limit)),
        total: mockData.certificates.length,
        limit: parseInt(limit),
        offset
      };
    }
    
    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(result.total / limit)
      },
      source: isDatabaseConnected ? 'database' : 'mock'
    });
  } catch (error) {
    console.error('Certificates API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificates',
      error: error.message
    });
  }
});

app.get(`${API_PREFIX}/verification/verify/:code`, async (req, res) => {
  try {
    const { code } = req.params;
    
    let certificate;
    if (isDatabaseConnected) {
      certificate = await DatabaseRepository.verifyCertificate(code);
    } else {
      certificate = mockData.certificates.find(c => c.verification_code === code);
      if (certificate) {
        const student = mockData.students.find(s => s.id === certificate.student_id);
        const course = mockData.courses.find(c => c.id === certificate.course_id);
        certificate = { ...certificate, ...student, ...course };
      }
    }
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found or invalid verification code'
      });
    }
    
    res.json({
      success: true,
      data: certificate,
      message: 'Certificate verified successfully',
      source: isDatabaseConnected ? 'database' : 'mock'
    });
  } catch (error) {
    console.error('Certificate verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify certificate',
      error: error.message
    });
  }
});

// Swagger documentation placeholder
app.get('/api-docs', (req, res) => {
  res.send(`
    <html>
      <head><title>CSL API Documentation</title></head>
      <body>
        <h1>CSL Management System API v3.0</h1>
        <h2>Database: ${isDatabaseConnected ? 'PostgreSQL (Connected)' : 'Mock Data (Fallback)'}</h2>
        <h3>Available Endpoints:</h3>
        <ul>
          <li>GET /health - Health check</li>
          <li>GET ${API_PREFIX}/students - List students</li>
          <li>GET ${API_PREFIX}/students/:id - Get student</li>
          <li>POST ${API_PREFIX}/students - Create student</li>
          <li>GET ${API_PREFIX}/courses - List courses</li>
          <li>GET ${API_PREFIX}/certificates - List certificates</li>
          <li>GET ${API_PREFIX}/verification/verify/:code - Verify certificate</li>
        </ul>
        <p><strong>Database Status:</strong> ${isDatabaseConnected ? '✅ Connected to PostgreSQL' : '⚠️ Using Mock Data'}</p>
      </body>
    </html>
  `);
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    availableRoutes: [
      'GET /health',
      `GET ${API_PREFIX}/students`,
      `GET ${API_PREFIX}/courses`,
      `GET ${API_PREFIX}/certificates`,
      `GET ${API_PREFIX}/verification/verify/:code`
    ]
  });
});

// Start server
async function startServer() {
  // Test database connection
  isDatabaseConnected = await testDatabaseConnection();
  
  const server = app.listen(PORT, () => {
    console.log('\n✅ Enhanced server with real database started successfully!');
    console.log(`🌐 Server URL: http://localhost:${PORT}`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log(`📚 Students: http://localhost:${PORT}${API_PREFIX}/students`);
    console.log(`📖 Courses: http://localhost:${PORT}${API_PREFIX}/courses`);
    console.log(`🏆 Certificates: http://localhost:${PORT}${API_PREFIX}/certificates`);
    console.log(`🔍 Verification: http://localhost:${PORT}${API_PREFIX}/verification/verify/{code}`);
    console.log(`📊 API Docs: http://localhost:${PORT}/api-docs`);
    console.log(`🗄️  Database: ${isDatabaseConnected ? 'PostgreSQL Connected' : 'Mock Data Fallback'}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('\n🎉 CSL Backend v3.0 with Real Database Integration is ready!');
  });
  
  return server;
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down...');
  if (pool) {
    pool.end(() => {
      console.log('✅ Database pool closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down...');
  if (pool) {
    pool.end(() => {
      console.log('✅ Database pool closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// Start the server
startServer().catch(console.error);
