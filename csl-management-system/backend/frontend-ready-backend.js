#!/usr/bin/env node

/**
 * Frontend-Ready Backend Server for CSL Management System
 * Specifically configured for React frontend on localhost:3000
 */

const http = require('http');
const url = require('url');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');

const PORT = 5001;

// Enhanced mock courses data
const courses = [
  {
    course_id: 1,
    code: "WD",
    title: "Web Development",
    description: "Full-stack web development course",
    duration_months: 6,
    is_active: true
  },
  {
    course_id: 2,
    code: "DS", 
    title: "Data Science",
    description: "Data analysis and machine learning",
    duration_months: 8,
    is_active: true
  },
  {
    course_id: 3,
    code: "CS",
    title: "Cybersecurity", 
    description: "Information security and ethical hacking",
    duration_months: 4,
    is_active: true
  },
  {
    course_id: 4,
    code: "AI",
    title: "Artificial Intelligence",
    description: "AI and machine learning fundamentals", 
    duration_months: 10,
    is_active: true
  },
  {
    course_id: 5,
    code: "MD",
    title: "Mobile Development",
    description: "iOS and Android app development",
    duration_months: 5,
    is_active: true
  }
];

// Enhanced mock students data
const students = [
  {
    student_id: 1,
    student_custom_id: "CSL-2024-001",
    name: "John Doe",
    email: "john.doe@email.com",
    mobile: "+1-555-0101",
    address: "123 Main St, New York, NY 10001",
    date_of_birth: "1995-05-15",
    status: "active",
    enrolled_courses: [1, 2], // Course IDs
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null
  },
  {
    student_id: 2,
    student_custom_id: "CSL-2024-002",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    mobile: "+1-555-0102",
    address: "456 Oak Ave, Los Angeles, CA 90210",
    date_of_birth: "1990-03-22",
    status: "active",
    enrolled_courses: [3, 4],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null
  },
  {
    student_id: 3,
    student_custom_id: "CSL-2024-003", 
    name: "Mike Chen",
    email: "mike.chen@email.com",
    mobile: "+1-555-0103",
    address: "789 Pine Rd, Chicago, IL 60601",
    date_of_birth: "1988-12-10",
    status: "inactive",
    enrolled_courses: [5],
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

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;
  const origin = req.headers.origin;
  const query = parsedUrl.query;

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

  // Helper function to parse JSON body
  const parseBody = () => {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (error) {
          reject(error);
        }
      });
    });
  };

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

    // Certificate API endpoints
    
    // Generate certificate for a student and course
    if (path.startsWith('/api/v1/certificates/generate') && method === 'POST') {
      try {
        const body = await parseBody();
        const { student_id, course_id } = body;
        
        if (!student_id || !course_id) {
          const response = {
            success: false,
            error: 'Student ID and Course ID are required',
            timestamp: new Date().toISOString()
          };
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response, null, 2));
          return;
        }
        
        // Find student and course
        const student = students.find(s => s.student_id === parseInt(student_id));
        const course = courses.find(c => c.course_id === parseInt(course_id));
        
        if (!student || !course) {
          const response = {
            success: false,
            error: 'Student or course not found',
            timestamp: new Date().toISOString()
          };
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response, null, 2));
          return;
        }
        
        // Import certificate service
        const CertificateService = require('./services/certificateService');
        const certificateService = new CertificateService(null); // No DB for mock
        
        // Generate serial number
        const serialData = await certificateService.generateSerialNumber(student_id, course_id, course.code);
        
        // Create mock certificate data
        const certificateData = {
          csl_number: serialData.serialNumber,
          issue_date: new Date(),
          status: 'active',
          student_name: student.name,
          student_custom_id: student.student_custom_id,
          student_email: student.email,
          course_name: course.title,
          course_code: course.code,
          course_description: course.description,
          duration_months: course.duration_months,
          issued_by_name: 'CSL Administration'
        };
        
        // Generate PDF
        const pdfBuffer = await certificateService.generateCertificatePDF(certificateData);
        
        // Respond with PDF file
        res.writeHead(200, {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="certificate_${certificateData.csl_number}.pdf"`,
          'Content-Length': pdfBuffer.length
        });
        res.end(pdfBuffer);
        return;
        
      } catch (error) {
        console.error('Certificate generation error:', error);
        const response = {
          success: false,
          error: 'Failed to generate certificate',
          details: error.message,
          timestamp: new Date().toISOString()
        };
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
        return;
      }
    }

    // Verify certificate by serial number
    if (path.startsWith('/api/v1/certificates/verify/') && method === 'GET') {
      try {
        const serialNumber = path.split('/')[5];
        
        if (!serialNumber) {
          const response = {
            success: false,
            error: 'Serial number is required',
            timestamp: new Date().toISOString()
          };
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response, null, 2));
          return;
        }
        
        // Import certificate service
        const CertificateService = require('./services/certificateService');
        const certificateService = new CertificateService(null);
        
        // Mock verification (in real app, this would check database)
        const verification = await certificateService.verifyCertificateMock(serialNumber, students, courses);
        
        const response = {
          success: true,
          data: verification,
          timestamp: new Date().toISOString()
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
        return;
        
      } catch (error) {
        console.error('Certificate verification error:', error);
        const response = {
          success: false,
          error: 'Failed to verify certificate',
          details: error.message,
          timestamp: new Date().toISOString()
        };
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
        return;
      }
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

    // Create new student
    if (path === '/api/v1/students' && method === 'POST') {
      try {
        const body = await parseBody();
        console.log('Creating new student:', body);
        
        // Generate new student ID
        const newStudentId = students.length > 0 
          ? Math.max(...students.map(s => s.student_id)) + 1 
          : 1;
        
        const currentDate = new Date().toISOString();
        
        const newStudent = {
          student_id: newStudentId,
          name: body.name || '',
          email: body.email || '',
          mobile: body.phone || '',
          student_custom_id: body.student_custom_id || `CSL-${new Date().getFullYear()}-${String(newStudentId).padStart(3, '0')}`,
          address: body.address || '',
          date_of_birth: body.date_of_birth || null,
          status: body.status || 'active',
          courses: body.course_id ? [courses.find(c => c.course_id === parseInt(body.course_id))].filter(Boolean) : [],
          certificates_count: 0,
          registration_date: currentDate.split('T')[0],
          last_active: 'Just now',
          created_at: currentDate,
          updated_at: currentDate,
          deleted_at: null
        };
        
        // Add to students array
        students.push(newStudent);
        
        const response = {
          success: true,
          message: 'Student created successfully',
          data: newStudent,
          timestamp: new Date().toISOString()
        };
        
        console.log(`✅ Student created: ${newStudent.name} (ID: ${newStudent.student_id})`);
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
        return;
      } catch (error) {
        console.error('Error creating student:', error);
        const response = {
          success: false,
          error: 'Failed to create student',
          details: error.message,
          timestamp: new Date().toISOString()
        };
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
        return;
      }
    }

    // Certificates API endpoints
    if (path === '/api/v1/certificates' && method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const { student_id, course_id, issued_by } = JSON.parse(body);
          
          // Validate input
          if (!student_id || !course_id || !issued_by) {
            throw new Error('Missing required fields');
          }
          
          // Create certificate
          const certificate = await certificateService.createCertificate(student_id, course_id, issued_by, students, courses);
          
          const response = {
            success: true,
            data: certificate,
            timestamp: new Date().toISOString()
          };
          
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response, null, 2));
        } catch (error) {
          console.error('Error creating certificate:', error);
          const response = {
            success: false,
            error: error.message || 'Internal server error',
            timestamp: new Date().toISOString()
          };
          
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response, null, 2));
        }
      });
      return;
    }

    if (path.startsWith('/api/v1/certificates/') && method === 'GET') {
      const cslNumber = path.split('/')[4];
      
      // Get certificate data
      const certificateData = await certificateService.getCertificateData(cslNumber, students, courses);
      
      if (!certificateData) {
        const response = {
          success: false,
          error: 'Certificate not found',
          timestamp: new Date().toISOString()
        };
        
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
        return;
      }
      
      // Generate PDF
      const pdfBuffer = await certificateService.generateCertificatePDF(certificateData);
      
      // Respond with PDF file
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate_${certificateData.csl_number}.pdf"`,
        'Content-Length': pdfBuffer.length
      });
      res.end(pdfBuffer);
      return;
    }

    // Verify certificate endpoint
    if (path === '/api/v1/certificates/verify' && method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const { csl_number } = JSON.parse(body);
          
          // Validate input
          if (!csl_number) {
            throw new Error('Missing required fields');
          }
          
          // Verify certificate
          const result = await certificateService.verifyCertificate(csl_number, students, courses);
          
          const response = {
            success: result.valid,
            data: result.valid ? result.certificate : null,
            message: result.message,
            timestamp: new Date().toISOString()
          };
          
          res.writeHead(result.valid ? 200 : 404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response, null, 2));
        } catch (error) {
          console.error('Error verifying certificate:', error);
          const response = {
            success: false,
            error: error.message || 'Internal server error',
            timestamp: new Date().toISOString()
          };
          
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response, null, 2));
        }
      });
      return;
    }

    // Get all courses
    if (path === '/api/v1/courses' && method === 'GET') {
      const response = {
        success: true,
        data: courses,
        timestamp: new Date().toISOString()
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
      return;
    }

    // Get course by ID
    if (path.startsWith('/api/v1/courses/') && method === 'GET') {
      const courseId = parseInt(path.split('/')[4]);
      const course = courses.find(c => c.course_id === courseId);
      
      if (course) {
        const response = {
          success: true,
          data: course,
          timestamp: new Date().toISOString()
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
      } else {
        const response = {
          success: false,
          error: 'Course not found',
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
          studentById: '/api/v1/students/:id',
          courses: '/api/v1/courses',
          courseById: '/api/v1/courses/:id',
          generateCertificate: 'POST /api/v1/certificates/generate',
          verifyCertificate: '/api/v1/certificates/verify/:serial'
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

// Certificate Service class integrated into the server
class CertificateService {
  /**
   * Generate serial number in format YYYY-CC-NNNN-VVVVVV
   */
  async generateSerialNumber(studentId, courseId, courses) {
    try {
      const currentYear = new Date().getFullYear();
      
      // Find course code
      const course = courses.find(c => c.course_id === courseId);
      if (!course) {
        throw new Error('Course not found');
      }
      
      const courseCode = course.code.toUpperCase();
      
      // Get next sequential number for this year and course
      const existingCerts = certificates.filter(cert => 
        cert.course_id === courseId && 
        cert.csl_number.startsWith(currentYear.toString())
      );
      
      const nextSequential = existingCerts.length + 1;
      const sequentialPart = nextSequential.toString().padStart(4, '0');
      
      // Generate verification hash
      const hashInput = `${studentId}-${courseId}-${currentYear}-${sequentialPart}`;
      const hash = crypto.createHash('sha256').update(hashInput).digest('hex');
      const verificationHash = hash.substring(0, 6).toUpperCase();
      
      // Construct full serial number
      const serialNumber = `${currentYear}-${courseCode}-${sequentialPart}-${verificationHash}`;
      
      return {
        serialNumber,
        year: currentYear,
        courseCode,
        sequentialPart: nextSequential,
        verificationHash
      };
    } catch (error) {
      console.error('Error generating serial number:', error);
      throw error;
    }
  }

  /**
   * Create a new certificate record
   */
  async createCertificate(studentId, courseId, issuedBy, students, courses) {
    try {
      const serialData = await this.generateSerialNumber(studentId, courseId, courses);
      
      const certificate = {
        certificate_id: certificateIdCounter++,
        csl_number: serialData.serialNumber,
        student_id: studentId,
        course_id: courseId,
        issued_by_admin_id: issuedBy,
        issue_date: new Date().toISOString().split('T')[0],
        status: 'active',
        created_at: new Date().toISOString()
      };
      
      certificates.push(certificate);
      
      return {
        ...certificate,
        serialData
      };
    } catch (error) {
      console.error('Error creating certificate:', error);
      throw error;
    }
  }

  /**
   * Get certificate data with student and course information
   */
  async getCertificateData(cslNumber, students, courses) {
    try {
      const certificate = certificates.find(cert => cert.csl_number === cslNumber);
      
      if (!certificate) {
        throw new Error('Certificate not found');
      }
      
      const student = students.find(s => s.student_id === certificate.student_id);
      const course = courses.find(c => c.course_id === certificate.course_id);
      
      return {
        csl_number: certificate.csl_number,
        issue_date: certificate.issue_date,
        status: certificate.status,
        student_name: student?.name || 'Unknown Student',
        student_custom_id: student?.student_custom_id || '',
        student_email: student?.email || '',
        course_name: course?.title || 'Unknown Course',
        course_code: course?.code || '',
        course_description: course?.description || '',
        duration_months: course?.duration_months || 0,
        issued_by_name: 'CSL Administration'
      };
    } catch (error) {
      console.error('Error getting certificate data:', error);
      throw error;
    }
  }

  /**
   * Generate certificate PDF from HTML template
   */
  async generateCertificatePDF(certificateData) {
    let browser;
    try {
      // Read HTML template
      const templatePath = path.join(__dirname, 'templates', 'certificate_template.html');
      let htmlTemplate = await fs.readFile(templatePath, 'utf8');
      
      // Replace placeholders with actual data
      const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long', 
          day: 'numeric'
        });
      };
      
      htmlTemplate = htmlTemplate
        .replace(/{{student_name}}/g, certificateData.student_name)
        .replace(/{{course_name}}/g, certificateData.course_name)
        .replace(/{{course_code}}/g, certificateData.course_code)
        .replace(/{{serial_number}}/g, certificateData.csl_number)
        .replace(/{{issue_date}}/g, formatDate(certificateData.issue_date))
        .replace(/{{duration}}/g, certificateData.duration_months)
        .replace(/{{issued_by}}/g, certificateData.issued_by_name || 'CSL Administration');
      
      // Launch puppeteer
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // Set content and wait for fonts/images to load
      await page.setContent(htmlTemplate, {
        waitUntil: ['domcontentloaded', 'networkidle0']
      });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in', 
          bottom: '0.5in',
          left: '0.5in'
        }
      });
      
      return pdfBuffer;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Verify certificate authenticity
   */
  async verifyCertificate(cslNumber, students, courses) {
    try {
      // Parse serial number components
      const parts = cslNumber.split('-');
      if (parts.length !== 4) {
        return { valid: false, message: 'Invalid serial number format' };
      }
      
      const [year, courseCode, sequential, providedHash] = parts;
      
      // Get certificate from database
      const certificateData = await this.getCertificateData(cslNumber, students, courses);
      
      if (!certificateData) {
        return { valid: false, message: 'Certificate not found' };
      }
      
      if (certificateData.status !== 'active') {
        return { 
          valid: false, 
          message: `Certificate is ${certificateData.status}`,
          certificate: certificateData
        };
      }
      
      // Verify hash
      const certificate = certificates.find(cert => cert.csl_number === cslNumber);
      const studentId = certificate.student_id;
      const courseId = certificate.course_id;
      
      const hashInput = `${studentId}-${courseId}-${year}-${sequential}`;
      const calculatedHash = crypto.createHash('sha256').update(hashInput).digest('hex');
      const expectedHash = calculatedHash.substring(0, 6).toUpperCase();
      
      if (providedHash !== expectedHash) {
        return { valid: false, message: 'Certificate hash verification failed' };
      }
      
      return {
        valid: true,
        message: 'Certificate is authentic and valid',
        certificate: certificateData
      };
    } catch (error) {
      console.error('Error verifying certificate:', error);
      return { valid: false, message: 'Verification failed due to system error' };
    }
  }
}

// Initialize certificate service
const certificateService = new CertificateService();

// Start the server
server.listen(PORT, () => {
  console.log('\n🚀 Frontend-Ready Backend Server Started');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log('🌐 CORS enabled for React frontend on localhost:3000');    console.log('📋 Available endpoints:');
    console.log('   GET  /health');
    console.log('   GET  /api/v1/students');
    console.log('   GET  /api/v1/students/:id');
    console.log('   POST /api/v1/students');
    console.log('   GET  /api/v1/courses');
    console.log('   GET  /api/v1/courses/:id');
    console.log('   POST /api/v1/certificates/generate');
    console.log('   GET  /api/v1/certificates/verify/:serial');
  console.log('   GET  /api/v1/courses');
  console.log('   GET  /api/v1/courses/:id');
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
