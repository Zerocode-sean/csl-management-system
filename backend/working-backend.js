const http = require('http');
const url = require('url');

const PORT = 5001;

console.log('🚀 Starting Backend Server on port', PORT);

// Available courses (from the database schema)
const coursesDB = [
  { course_id: 1, code: 'CS', title: 'Computer Science Fundamentals', description: 'Comprehensive introduction to computer science principles and programming', duration_months: 6, is_active: true },
  { course_id: 2, code: 'WD', title: 'Web Development', description: 'Full-stack web development with modern frameworks and tools', duration_months: 4, is_active: true },
  { course_id: 3, code: 'DS', title: 'Data Science', description: 'Data analysis, machine learning, and statistical modeling', duration_months: 8, is_active: true },
  { course_id: 4, code: 'CY', title: 'Cybersecurity', description: 'Network security, ethical hacking, and information security', duration_months: 6, is_active: true },
  { course_id: 5, code: 'AI', title: 'Artificial Intelligence', description: 'Machine learning, deep learning, and AI applications', duration_months: 10, is_active: true },
  { course_id: 6, code: 'DB', title: 'Database Administration', description: 'Database design, SQL, and database management systems', duration_months: 5, is_active: true },
  { course_id: 7, code: 'PM', title: 'Project Management', description: 'Agile methodologies, project planning, and team leadership', duration_months: 3, is_active: true },
  { course_id: 8, code: 'UI', title: 'UI/UX Design', description: 'User interface design, user experience, and design thinking', duration_months: 4, is_active: true },
  { course_id: 9, code: 'MB', title: 'Mobile App Development', description: 'iOS and Android app development with React Native', duration_months: 6, is_active: true },
  { course_id: 10, code: 'CC', title: 'Cloud Computing', description: 'AWS, Azure, Docker, and cloud infrastructure management', duration_months: 5, is_active: true }
];

// In-memory data storage (persists across requests)
let studentsDB = [
  {
    student_id: 1,
    name: 'John Doe',
    email: 'john.doe@email.com',
    mobile: '+1234567890',
    address: '123 Main St',
    date_of_birth: '1995-05-15',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    course_id: 1,
    course_code: 'CS',
    course_title: 'Computer Science Fundamentals',
    courses: 3,
    certificates: 1,
    status: 'active',
    institution: 'Tech University'
  },
  {
    student_id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@email.com',
    mobile: '+0987654321',
    address: '456 Oak Ave',
    date_of_birth: '1992-08-22',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    course_id: 2,
    course_code: 'WD',
    course_title: 'Web Development',
    courses: 5,
    certificates: 0,
    status: 'inactive',
    institution: 'State College'
  },
  {
    student_id: 3,
    name: 'Mike Johnson',
    email: 'mike.johnson@email.com',
    mobile: '+1122334455',
    address: '789 Pine Rd',
    date_of_birth: '1998-03-10',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    course_id: 3,
    course_code: 'DS',
    course_title: 'Data Science',
    courses: 2,
    certificates: 1,
    status: 'graduated',
    institution: 'Community College'
  },
  {
    student_id: 4,
    name: 'Sarah Wilson',
    email: 'sarah.wilson@email.com',
    mobile: '+1555666777',
    address: '321 Elm St',
    date_of_birth: '1996-11-30',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    course_id: 4,
    course_code: 'CY',
    course_title: 'Cybersecurity',
    courses: 1,
    certificates: 0,
    status: 'suspended',
    institution: 'Online Academy'
  },
  {
    student_id: 5,
    name: 'David Brown',
    email: 'david.brown@email.com',
    mobile: '+1888999000',
    address: '654 Maple Ave',
    date_of_birth: '1993-07-12',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    course_id: 5,
    course_code: 'AI',
    course_title: 'Artificial Intelligence',
    courses: 4,
    certificates: 1,
    status: 'active',
    institution: 'Tech Institute'
  },
  {
    student_id: 6,
    name: 'Lisa Garcia',
    email: 'lisa.garcia@email.com',
    mobile: '+1777888999',
    address: '987 Oak Street',
    date_of_birth: '1994-04-18',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    course_id: 6,
    course_code: 'DB',
    course_title: 'Database Administration',
    courses: 6,
    certificates: 1,
    status: 'graduated',
    institution: 'University College'
  }
];

let nextStudentId = 7; // Counter for generating new IDs

// Certificates database
let certificatesDB = [];
let nextCertificateId = 1;

// Helper function to generate CSL number
const generateCslNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `CSL${timestamp}${random}`;
};

// Helper function to get course info by ID
const getCourseById = (courseId) => {
  return coursesDB.find(course => course.course_id === courseId);
};

// Helper function to add course info to student
const addCourseInfoToStudent = (student) => {
  if (student.course_id) {
    const course = getCourseById(student.course_id);
    if (course) {
      student.course_code = course.code;
      student.course_title = course.title;
    }
  }
  return student;
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;
  
  console.log(`${method} ${pathname}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health endpoint
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK', timestamp: new Date().toISOString() }));
    return;
  }
  
  // Courses API
  if (pathname === '/api/v1/courses' && method === 'GET') {
    // Parse query parameters
    const page = parseInt(parsedUrl.query.page) || 1;
    const limit = parseInt(parsedUrl.query.limit) || 10;
    const search = parsedUrl.query.search || '';
    const active = parsedUrl.query.active;
    
    console.log('Courses API called with:', { page, limit, search, active });
    
    // Filter courses
    let filteredCourses = coursesDB;
    
    // Filter by active status if specified
    if (active !== undefined) {
      const isActive = active === 'true';
      filteredCourses = filteredCourses.filter(course => course.is_active === isActive);
    }
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCourses = filteredCourses.filter(course => 
        course.code.toLowerCase().includes(searchLower) ||
        course.title.toLowerCase().includes(searchLower) ||
        (course.description && course.description.toLowerCase().includes(searchLower))
      );
    }
    
    // Calculate pagination
    const total = filteredCourses.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedCourses = filteredCourses.slice(offset, offset + limit);
    
    const response = {
      success: true,
      data: paginatedCourses,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      message: 'Courses retrieved successfully'
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response, null, 2));
    return;
  }

  // Create Course API
  if (pathname === '/api/v1/courses' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const courseData = JSON.parse(body);
        console.log('Creating course:', courseData);
        
        // Validate required fields
        if (!courseData.code || !courseData.title) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Course code and title are required' }));
          return;
        }

        // Check if course code already exists
        const existingCourse = coursesDB.find(c => c.code === courseData.code);
        if (existingCourse) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Course code already exists' }));
          return;
        }
        
        // Generate new course ID
        const newCourseId = Math.max(...coursesDB.map(c => c.course_id)) + 1;
        
        // Create new course object
        const newCourse = {
          course_id: newCourseId,
          code: courseData.code,
          title: courseData.title,
          description: courseData.description || '',
          duration_months: courseData.duration_months || null,
          is_active: courseData.is_active !== undefined ? courseData.is_active : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null
        };
        
        // Add to courses database
        coursesDB.push(newCourse);
        
        const response = {
          success: true,
          data: newCourse,
          message: 'Course created successfully'
        };
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
      } catch (error) {
        console.error('Error creating course:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid request body' }));
      }
    });
    return;
  }

  // Update Course API
  if (pathname.startsWith('/api/v1/courses/') && method === 'PUT') {
    const courseId = parseInt(pathname.split('/')[4]);
    
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const courseData = JSON.parse(body);
        console.log('Updating course:', courseId, courseData);
        
        // Find course in database
        const courseIndex = coursesDB.findIndex(c => c.course_id === courseId);
        
        if (courseIndex === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Course not found' }));
          return;
        }

        // Check if updating code conflicts with existing course
        if (courseData.code && courseData.code !== coursesDB[courseIndex].code) {
          const existingCourse = coursesDB.find(c => c.code === courseData.code && c.course_id !== courseId);
          if (existingCourse) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Course code already exists' }));
            return;
          }
        }
        
        // Update course fields
        const updatedCourse = {
          ...coursesDB[courseIndex],
          ...courseData,
          course_id: courseId, // Keep original ID
          updated_at: new Date().toISOString()
        };
        
        coursesDB[courseIndex] = updatedCourse;
        
        const response = {
          success: true,
          data: updatedCourse,
          message: 'Course updated successfully'
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
      } catch (error) {
        console.error('Error updating course:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid request body' }));
      }
    });
    return;
  }

  // Delete Course API
  if (pathname.startsWith('/api/v1/courses/') && method === 'DELETE') {
    const courseId = parseInt(pathname.split('/')[4]);
    console.log('Deleting course:', courseId);
    
    // Find course in database
    const courseIndex = coursesDB.findIndex(c => c.course_id === courseId);
    
    if (courseIndex === -1) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Course not found' }));
      return;
    }
    
    // Check if course is used by any students
    const studentsUsingCourse = studentsDB.filter(s => s.course_id === courseId && !s.deleted_at);
    if (studentsUsingCourse.length > 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        error: `Cannot delete course. ${studentsUsingCourse.length} student(s) are enrolled in this course.` 
      }));
      return;
    }
    
    // Remove course from database (hard delete for simplicity)
    const deletedCourse = coursesDB.splice(courseIndex, 1)[0];
    
    const response = {
      success: true,
      message: `Course "${deletedCourse.title}" deleted successfully`
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response, null, 2));
    return;
  }

  // Get Single Course API
  if (pathname.startsWith('/api/v1/courses/') && method === 'GET') {
    const courseId = parseInt(pathname.split('/')[4]);
    console.log('Getting course:', courseId);
    
    // Find course in database
    const course = coursesDB.find(c => c.course_id === courseId);
    
    if (!course) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Course not found' }));
      return;
    }
    
    const response = {
      success: true,
      data: course,
      message: 'Course retrieved successfully'
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response, null, 2));
    return;
  }
  
  // Students API
  if (pathname === '/api/v1/students' && method === 'GET') {
    // Parse query parameters
    const page = parseInt(parsedUrl.query.page) || 1;
    const limit = parseInt(parsedUrl.query.limit) || 10;
    const search = parsedUrl.query.search || '';
    const status = parsedUrl.query.status || '';
    
    console.log('Students API called with:', { page, limit, search, status });
    
    // Use persistent data from studentsDB
    const allStudents = studentsDB.filter(student => !student.deleted_at);
    
    // Apply search filter
    let filteredStudents = allStudents;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredStudents = allStudents.filter(student => 
        student.name.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower) ||
        student.student_id.toString().includes(searchLower) ||
        student.institution.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply status filter
    if (status && status !== 'all') {
      filteredStudents = filteredStudents.filter(student => 
        student.status.toLowerCase() === status.toLowerCase()
      );
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedStudents = filteredStudents.slice(startIndex, endIndex);
    
    const response = {
      success: true,
      data: paginatedStudents,
      pagination: {
        page: page,
        limit: limit,
        total: filteredStudents.length,
        totalPages: Math.ceil(filteredStudents.length / limit)
      },
      filters: {
        search: search,
        status: status || 'all'
      }
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response, null, 2));
    return;
  }
  
  // Add Student API
  if (pathname === '/api/v1/students' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const newStudent = JSON.parse(body);
        console.log('Creating new student:', newStudent);
        
        // Create new student object
        const studentToAdd = {
          student_id: nextStudentId++,
          name: newStudent.name,
          email: newStudent.email,
          mobile: newStudent.mobile || '',
          address: newStudent.address || '',
          date_of_birth: newStudent.date_of_birth || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
          course_id: newStudent.course_id || null,
          courses: 0,
          certificates: 0,
          status: newStudent.status || 'active',
          institution: newStudent.institution || 'Computer Science Lanka'
        };
        
        // Add course info if course_id is provided
        addCourseInfoToStudent(studentToAdd);
        
        // Add to persistent storage
        studentsDB.push(studentToAdd);
        
        const response = {
          success: true,
          data: studentToAdd,
          message: 'Student created successfully'
        };
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
      } catch (error) {
        console.error('Error creating student:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid request body' }));
      }
    });
    return;
  }
  
  // Update Student API
  if (pathname.startsWith('/api/v1/students/') && method === 'PUT') {
    const studentId = parseInt(pathname.split('/')[4]);
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const updatedData = JSON.parse(body);
        console.log('Updating student:', studentId, updatedData);
        
        // Find and update student in persistent storage
        const studentIndex = studentsDB.findIndex(s => s.student_id === studentId && !s.deleted_at);
        
        if (studentIndex === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Student not found' }));
          return;
        }
        
        // Update the student
        studentsDB[studentIndex] = {
          ...studentsDB[studentIndex],
          ...updatedData,
          updated_at: new Date().toISOString()
        };
        
        // Add course info if course_id was updated
        addCourseInfoToStudent(studentsDB[studentIndex]);
        
        const response = {
          success: true,
          data: studentsDB[studentIndex],
          message: 'Student updated successfully'
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
      } catch (error) {
        console.error('Error updating student:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid request body' }));
      }
    });
    return;
  }
  
  // Delete Student API
  if (pathname.startsWith('/api/v1/students/') && method === 'DELETE') {
    const studentId = parseInt(pathname.split('/')[4]);
    console.log('Deleting student:', studentId);
    
    // Find and soft delete student in persistent storage
    const studentIndex = studentsDB.findIndex(s => s.student_id === studentId && !s.deleted_at);
    
    if (studentIndex === -1) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Student not found' }));
      return;
    }
    
    // Soft delete (mark as deleted)
    studentsDB[studentIndex].deleted_at = new Date().toISOString();
    
    const response = {
      success: true,
      message: `Student "${studentsDB[studentIndex].name}" deleted successfully`
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response, null, 2));
    return;
  }
  
  // Get all Certificates API
  if (pathname === '/api/v1/certificates' && method === 'GET') {
    const page = parseInt(parsedUrl.query.page) || 1;
    const limit = parseInt(parsedUrl.query.limit) || 10;
    const status = parsedUrl.query.status;
    
    console.log('Certificates API called with:', { page, limit, status });
    
    // Filter certificates
    let filteredCertificates = certificatesDB.filter(cert => !cert.deleted_at);
    
    // Filter by status if specified
    if (status && status !== 'all') {
      filteredCertificates = filteredCertificates.filter(cert => cert.status === status);
    }
    
    // Calculate pagination
    const total = filteredCertificates.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedCertificates = filteredCertificates.slice(offset, offset + limit);
    
    const response = {
      success: true,
      data: {
        certificates: paginatedCertificates,
        total,
        totalPages,
        currentPage: page
      },
      message: 'Certificates retrieved successfully'
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response, null, 2));
    return;
  }
  
  // Issue Certificate API (POST /api/v1/certificates)
  if (pathname === '/api/v1/certificates' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const certData = JSON.parse(body);
        console.log('Issuing certificate:', certData);
        
        // Validate required fields
        if (!certData.student_id || !certData.course_id) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Student ID and Course ID are required' }));
          return;
        }
        
        // Find student and course
        const student = studentsDB.find(s => s.student_id === parseInt(certData.student_id) && !s.deleted_at);
        const course = coursesDB.find(c => c.course_id === parseInt(certData.course_id));
        
        if (!student) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Student not found' }));
          return;
        }
        
        if (!course) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Course not found' }));
          return;
        }
        
        // Create new certificate
        const newCertificate = {
          certificate_id: nextCertificateId++,
          csl_number: generateCslNumber(),
          student_id: parseInt(certData.student_id),
          student_name: student.name,
          student_email: student.email,
          course_id: parseInt(certData.course_id),
          course_code: course.code,
          course_title: course.title,
          issue_date: certData.issue_date || new Date().toISOString().split('T')[0],
          completion_date: certData.completion_date || new Date().toISOString().split('T')[0],
          grade: certData.grade || null,
          status: 'active',
          pdf_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null
        };
        
        certificatesDB.push(newCertificate);
        
        const response = {
          success: true,
          data: { certificate: newCertificate },
          message: 'Certificate issued successfully'
        };
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
      } catch (error) {
        console.error('Error issuing certificate:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid request body' }));
      }
    });
    return;
  }
  
  // Get Certificate by CSL Number API
  if (pathname.startsWith('/api/v1/certificates/') && method === 'GET') {
    const cslNumber = pathname.split('/')[4];
    console.log('Getting certificate by CSL number:', cslNumber);
    
    const certificate = certificatesDB.find(cert => cert.csl_number === cslNumber && !cert.deleted_at);
    
    if (!certificate) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Certificate not found' }));
      return;
    }
    
    const response = {
      success: true,
      data: { certificate },
      message: 'Certificate retrieved successfully'
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response, null, 2));
    return;
  }
  
  // Download Certificate PDF API
  if (pathname.startsWith('/api/v1/certificates/') && pathname.endsWith('/download') && method === 'GET') {
    const cslNumber = pathname.split('/')[4];
    console.log('Downloading certificate PDF:', cslNumber);
    
    const certificate = certificatesDB.find(cert => cert.csl_number === cslNumber && !cert.deleted_at);
    
    if (!certificate) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Certificate not found' }));
      return;
    }
    
    // For now, return a placeholder response (in real implementation, generate PDF)
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: true, 
      message: 'PDF generation not implemented yet',
      data: { csl_number: cslNumber }
    }));
    return;
  }
  
  // Revoke Certificate API
  if (pathname.startsWith('/api/v1/certificates/') && pathname.endsWith('/revoke') && method === 'POST') {
    const cslNumber = pathname.split('/')[4];
    
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const { reason } = JSON.parse(body);
        console.log('Revoking certificate:', cslNumber, 'Reason:', reason);
        
        const certIndex = certificatesDB.findIndex(cert => cert.csl_number === cslNumber && !cert.deleted_at);
        
        if (certIndex === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Certificate not found' }));
          return;
        }
        
        // Update certificate status
        certificatesDB[certIndex].status = 'revoked';
        certificatesDB[certIndex].revoke_reason = reason;
        certificatesDB[certIndex].revoked_at = new Date().toISOString();
        certificatesDB[certIndex].updated_at = new Date().toISOString();
        
        const response = {
          success: true,
          data: { certificate: certificatesDB[certIndex] },
          message: 'Certificate revoked successfully'
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
      } catch (error) {
        console.error('Error revoking certificate:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid request body' }));
      }
    });
    return;
  }
  
  // 404 for everything else
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: false, message: `Route ${method} ${pathname} not found` }));
});

server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log('   GET /health');
  console.log('   GET /api/v1/courses');
  console.log('   POST /api/v1/courses');
  console.log('   GET /api/v1/courses/:id');
  console.log('   PUT /api/v1/courses/:id');
  console.log('   DELETE /api/v1/courses/:id');
  console.log('   GET /api/v1/students');
  console.log('   POST /api/v1/students');
  console.log('   PUT /api/v1/students/:id');
  console.log('   DELETE /api/v1/students/:id');
  console.log('   GET /api/v1/certificates');
  console.log('   POST /api/v1/certificates');
  console.log('   GET /api/v1/certificates/:cslNumber');
  console.log('   GET /api/v1/certificates/:cslNumber/download');
  console.log('   POST /api/v1/certificates/:cslNumber/revoke');
});

server.on('error', (err) => {
  console.error('❌ Server error:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is already in use`);
  }
});
