/**
 * Comprehensive End-to-End Test Suite
 * CSL Management System - Complete Workflow Testing
 * 
 * Test Flow:
 * 1. Authentication (Login)
 * 2. Students Module (Load, Add, Edit, View, Soft Delete)
 * 3. Courses Module (Add, Edit, Delete)
 * 4. Certificates Module (Issue, Revoke, Generate PDF)
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api/v1';
let authToken = '';
let testStudent = null;
let testCourse = null;
let testCertificate = null;

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
    test: `${colors.magenta}→${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`
  };
  console.log(`${prefix[type] || prefix.info} [${timestamp}] ${message}`);
}

function printSectionHeader(title) {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}${colors.blue}${title}${colors.reset}`);
  console.log('='.repeat(80) + '\n');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// 1. AUTHENTICATION TESTS
// ============================================================================

async function testLogin() {
  printSectionHeader('1. AUTHENTICATION - LOGIN TEST');
  
  try {
    log('Attempting to login...', 'test');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@csl.com',
      password: 'Admin@2025'
    });

    if (response.data.data && response.data.data.accessToken) {
      authToken = response.data.data.accessToken;
      log(`Login successful! Token: ${authToken.substring(0, 20)}...`, 'success');
      log(`User: ${response.data.data.admin.username} (${response.data.data.admin.role})`, 'info');
      return true;
    } else {
      log('Login failed: No token received', 'error');
      return false;
    }
  } catch (error) {
    log(`Login failed: ${error.response?.data?.message || error.message}`, 'error');
    return false;
  }
}

// ============================================================================
// 2. STUDENTS MODULE TESTS
// ============================================================================

async function testLoadStudents() {
  printSectionHeader('2. STUDENTS MODULE - LOAD STUDENTS');
  
  try {
    log('Fetching students list (page 1, limit 10)...', 'test');
    
    const response = await axios.get(`${BASE_URL}/students`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 1, limit: 10 }
    });

    const students = response.data.data?.students || response.data.students || [];
    const pagination = response.data.data?.pagination || response.data.pagination || {};
    
    log(`Successfully loaded ${students.length} students`, 'success');
    if (pagination.total !== undefined) {
      log(`Total: ${pagination.total} | Page: ${pagination.page}/${pagination.totalPages}`, 'info');
    }
    
    if (students.length > 0) {
      log(`Sample student: ${students[0].name} (ID: ${students[0].student_id})`, 'info');
    }
    
    return students;
  } catch (error) {
    log(`Failed to load students: ${error.response?.data?.message || error.message}`, 'error');
    return [];
  }
}

async function testAddStudent() {
  printSectionHeader('2. STUDENTS MODULE - ADD NEW STUDENT');
  
  const timestamp = Date.now();
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 900) + 100; // 3 digit number
  const newStudent = {
    name: 'John Doe',
    email: `johndoe${randomNum}@test2mail.com`,
    phone: '+251911234567',
    student_custom_id: `CSL-${year}-${randomNum}`,
    date_of_birth: '1995-05-15',
    address: '123 Test Street, Addis Ababa, Ethiopia',
    institution: 'Test University',
    grade: 'Grade 12'
  };

  try {
    log('Adding new student...', 'test');
    log(`Email: ${newStudent.email}`, 'info');
    log(`Student ID: ${newStudent.student_custom_id}`, 'info');
    
    const response = await axios.post(`${BASE_URL}/students`, newStudent, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    testStudent = response.data.data?.student || response.data.data || response.data.student;
    log(`Student added successfully! ID: ${testStudent.student_id}`, 'success');
    log(`Name: ${testStudent.name}`, 'info');
    
    return testStudent;
  } catch (error) {
    log(`Failed to add student: ${error.response?.data?.message || error.message}`, 'error');
    if (error.response?.data?.errors) {
      console.log('Validation errors:', error.response.data.errors);
    }
    return null;
  }
}

async function testViewStudent(studentId) {
  printSectionHeader('2. STUDENTS MODULE - VIEW STUDENT DETAILS');
  
  try {
    log(`Fetching details for student ID: ${studentId}...`, 'test');
    
    const response = await axios.get(`${BASE_URL}/students/${studentId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const student = response.data.data || response.data;
    log('Student details retrieved successfully!', 'success');
    log(`Name: ${student.name}`, 'info');
    log(`Email: ${student.email}`, 'info');
    log(`Phone: ${student.mobile}`, 'info');
    log(`Status: ${student.status}`, 'info');
    
    return student;
  } catch (error) {
    log(`Failed to view student: ${error.response?.data?.message || error.message}`, 'error');
    return null;
  }
}

async function testEditStudent(studentId) {
  printSectionHeader('2. STUDENTS MODULE - EDIT STUDENT DATA');
  
  const updates = {
    phone: '+251933456789',
    address: '456 Updated Street, Addis Ababa, Ethiopia'
  };

  try {
    log(`Updating student ID: ${studentId}...`, 'test');
    log(`New phone: ${updates.phone}`, 'info');
    log(`New address: ${updates.address}`, 'info');
    
    const response = await axios.put(`${BASE_URL}/students/${studentId}`, updates, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const updatedStudent = response.data.data || response.data.student || response.data;
    log('Student updated successfully!', 'success');
    log(`Updated phone: ${updatedStudent.mobile || updatedStudent.phone}`, 'info');
    log(`Updated address: ${updatedStudent.address}`, 'info');
    
    return updatedStudent;
  } catch (error) {
    log(`Failed to edit student: ${error.response?.data?.message || error.message}`, 'error');
    return null;
  }
}

async function testSoftDeleteStudent(studentId) {
  printSectionHeader('2. STUDENTS MODULE - SOFT DELETE STUDENT');
  
  try {
    log(`Soft deleting student ID: ${studentId}...`, 'test');
    
    const response = await axios.delete(`${BASE_URL}/students/${studentId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    log('Student soft deleted successfully!', 'success');
    log('Verifying soft delete...', 'test');
    
    // Verify student is marked as deleted
    const checkResponse = await axios.get(`${BASE_URL}/students/${studentId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (checkResponse.data.deleted_at) {
      log(`Confirmed: Student deleted at ${checkResponse.data.deleted_at}`, 'success');
      log('Note: Student record still exists but marked as deleted (soft delete)', 'info');
    } else {
      log('Warning: Soft delete verification unclear', 'warning');
    }
    
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      log('Student not accessible after deletion (as expected)', 'success');
      return true;
    }
    log(`Failed to delete student: ${error.response?.data?.message || error.message}`, 'error');
    return false;
  }
}

// ============================================================================
// 3. COURSES MODULE TESTS
// ============================================================================

async function testLoadCourses() {
  printSectionHeader('3. COURSES MODULE - LOAD COURSES');
  
  try {
    log('Fetching courses list...', 'test');
    
    const response = await axios.get(`${BASE_URL}/courses`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const courses = response.data.data?.courses || response.data.courses || [];
    log(`Successfully loaded ${courses.length} courses`, 'success');
    
    if (courses.length > 0) {
      log(`Sample course: ${courses[0].title} (Code: ${courses[0].code})`, 'info');
    }
    
    return courses;
  } catch (error) {
    log(`Failed to load courses: ${error.response?.data?.message || error.message}`, 'error');
    return [];
  }
}

async function testAddCourse() {
  printSectionHeader('3. COURSES MODULE - ADD NEW COURSE');
  
  // Generate a unique course code using timestamp
  const timestamp = Date.now();
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomCode = `${letters.charAt(timestamp % 26)}${letters.charAt(Math.floor(timestamp / 26) % 26)}`;
  
  const newCourse = {
    code: randomCode,
    title: `Test Course ${timestamp}`,
    description: 'Comprehensive course on software testing practices',
    duration_months: 3
  };

  try {
    log('Adding new course...', 'test');
    log(`Course: ${newCourse.title}`, 'info');
    log(`Code: ${newCourse.code}`, 'info');
    
    const response = await axios.post(`${BASE_URL}/courses`, newCourse, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    testCourse = response.data.data || response.data.course || response.data;
    log(`Course added successfully! ID: ${testCourse.course_id}`, 'success');
    log(`Duration: ${testCourse.duration_months} months`, 'info');
    
    return testCourse;
  } catch (error) {
    log(`Failed to add course: ${error.response?.data?.message || error.message}`, 'error');
    if (error.response?.data?.errors) {
      console.log('Validation errors:', error.response.data.errors);
    }
    return null;
  }
}

async function testEditCourse(courseId) {
  printSectionHeader('3. COURSES MODULE - EDIT COURSE');
  
  const updates = {
    duration_months: 6,
    description: 'Updated: Comprehensive and advanced course on modern testing practices'
  };

  try {
    log(`Updating course ID: ${courseId}...`, 'test');
    log(`New duration: ${updates.duration_months} months`, 'info');
    
    const response = await axios.put(`${BASE_URL}/courses/${courseId}`, updates, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const updatedCourse = response.data.data || response.data.course || response.data;
    log('Course updated successfully!', 'success');
    log(`Updated duration: ${updatedCourse.duration_months} months`, 'info');
    
    return updatedCourse;
  } catch (error) {
    log(`Failed to edit course: ${error.response?.data?.message || error.message}`, 'error');
    return null;
  }
}

async function testDeleteCourse(courseId, hasCertificates = false) {
  printSectionHeader('3. COURSES MODULE - DELETE COURSE');
  
  try {
    log(`Deleting course ID: ${courseId}...`, 'test');
    
    const response = await axios.delete(`${BASE_URL}/courses/${courseId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    log('Course deleted successfully!', 'success');
    
    // Try to verify deletion
    try {
      await axios.get(`${BASE_URL}/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      log('Warning: Course still accessible after deletion', 'warning');
    } catch (checkError) {
      if (checkError.response?.status === 404) {
        log('Confirmed: Course no longer accessible', 'success');
      }
    }
    
    return true;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    
    // If the course has certificates, this is expected behavior
    if (hasCertificates && errorMsg.includes('associated certificate')) {
      log('Expected: Cannot delete course with associated certificates', 'info');
      log('Course should be archived instead', 'info');
      return true; // Consider this a successful test of the validation
    }
    
    log(`Failed to delete course: ${errorMsg}`, 'error');
    return false;
  }
}

// ============================================================================
// 4. CERTIFICATES MODULE TESTS
// ============================================================================

async function testIssueCertificate(studentId, courseId) {
  printSectionHeader('4. CERTIFICATES MODULE - ISSUE CERTIFICATE');
  
  const certificateData = {
    student_id: studentId,
    course_id: courseId
  };

  try {
    log('Issuing certificate...', 'test');
    log(`Student ID: ${studentId}`, 'info');
    log(`Course ID: ${courseId}`, 'info');
    
    const response = await axios.post(`${BASE_URL}/certificates/generate`, certificateData, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 60000 // 60 seconds for PDF generation
    });

    testCertificate = response.data.data;
    log(`Certificate issued successfully!`, 'success');
    log(`CSL Number: ${testCertificate.csl_number}`, 'info');
    log(`PDF URL: ${testCertificate.pdf_url}`, 'info');
    
    return testCertificate;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    log(`Failed to issue certificate: ${errorMsg}`, 'error');
    if (error.response?.data?.errors) {
      console.log('Validation errors:', error.response.data.errors);
    }
    // Return partial success if it's just a PDF generation timeout
    if (errorMsg.includes('Timed out') || errorMsg.includes('timeout')) {
      log('Note: Certificate may have been created but PDF generation timed out', 'warning');
    }
    return null;
  }
}

async function testViewCertificate(certificate) {
  printSectionHeader('4. CERTIFICATES MODULE - VIEW CERTIFICATE');
  
  try {
    log(`Fetching certificate by CSL Number: ${certificate.csl_number}...`, 'test');
    
    const response = await axios.get(`${BASE_URL}/certificates/csl/${certificate.csl_number}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const certData = response.data.data?.certificate || response.data.data;
    log('Certificate details retrieved successfully!', 'success');
    log(`CSL Number: ${certData.csl_number}`, 'info');
    log(`Status: ${certData.status}`, 'info');
    log(`Issue Date: ${certData.issue_date}`, 'info');
    
    return certData;
  } catch (error) {
    log(`Failed to view certificate: ${error.response?.data?.message || error.message}`, 'error');
    return null;
  }
}

async function testGenerateCertificatePDF(cslNumber) {
  printSectionHeader('4. CERTIFICATES MODULE - GENERATE CERTIFICATE PDF');
  
  try {
    log(`Downloading PDF for CSL Number: ${cslNumber}...`, 'test');
    
    const response = await axios.get(`${BASE_URL}/certificates/${cslNumber}/download`, {
      headers: { Authorization: `Bearer ${authToken}` },
      responseType: 'arraybuffer',
      timeout: 60000 // 60 seconds for PDF generation
    });

    const pdfDir = path.join(__dirname, 'test-certificates');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const filename = `certificate_${cslNumber}_${Date.now()}.pdf`;
    const filepath = path.join(pdfDir, filename);
    fs.writeFileSync(filepath, response.data);

    const fileSizeKB = (fs.statSync(filepath).size / 1024).toFixed(2);
    log('PDF downloaded and saved successfully!', 'success');
    log(`File: ${filepath}`, 'info');
    log(`Size: ${fileSizeKB} KB`, 'info');
    
    return filepath;
  } catch (error) {
    log(`Failed to download PDF: ${error.response?.data?.message || error.message}`, 'error');
    return null;
  }
}

async function testRevokeCertificate(certificate) {
  printSectionHeader('4. CERTIFICATES MODULE - REVOKE CERTIFICATE');
  
  const revokeData = {
    revocation_reason: 'Testing revocation functionality - automated E2E test'
  };

  try {
    log(`Revoking certificate by CSL Number: ${certificate.csl_number}...`, 'test');
    log(`Reason: ${revokeData.revocation_reason}`, 'info');
    
    const response = await axios.patch(
      `${BASE_URL}/certificates/csl/${certificate.csl_number}/revoke`,
      revokeData,
      { 
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 30000 // 30 seconds for revocation
      }
    );

    const revokedCertificate = response.data.data?.certificate || response.data.data || response.data.certificate;
    log('Certificate revoked successfully!', 'success');
    log(`Status: ${revokedCertificate.status}`, 'info');
    log(`Revoked at: ${revokedCertificate.revoked_at}`, 'info');
    
    return revokedCertificate;
  } catch (error) {
    log(`Failed to revoke certificate: ${error.response?.data?.message || error.message}`, 'error');
    return null;
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runComprehensiveTests() {
  console.log('\n');
  console.log(colors.bright + colors.blue);
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                              ║');
  console.log('║          CSL MANAGEMENT SYSTEM - COMPREHENSIVE E2E TEST SUITE                ║');
  console.log('║                                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  console.log('\n');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  const runTest = async (name, testFn, ...args) => {
    results.total++;
    try {
      const result = await testFn(...args);
      if (result !== false && result !== null) {
        results.passed++;
        results.tests.push({ name, status: 'PASSED', result });
        return result;
      } else {
        results.failed++;
        results.tests.push({ name, status: 'FAILED', result: null });
        return null;
      }
    } catch (error) {
      results.failed++;
      results.tests.push({ name, status: 'FAILED', error: error.message });
      log(`Test "${name}" threw an error: ${error.message}`, 'error');
      return null;
    }
  };

  // Run all tests in sequence
  log('Starting comprehensive test suite...', 'info');
  await sleep(500);

  // 1. Authentication
  const loginSuccess = await runTest('Login', testLogin);
  if (!loginSuccess) {
    log('Cannot continue tests without authentication', 'error');
    return printTestSummary(results);
  }
  await sleep(1000);

  // 2. Students Module
  const students = await runTest('Load Students', testLoadStudents);
  await sleep(500);
  
  const newStudent = await runTest('Add Student', testAddStudent);
  await sleep(500);
  
  if (newStudent) {
    await runTest('View Student', testViewStudent, newStudent.student_id);
    await sleep(500);
    
    await runTest('Edit Student', testEditStudent, newStudent.student_id);
    await sleep(500);
  }

  // 3. Courses Module
  const courses = await runTest('Load Courses', testLoadCourses);
  await sleep(500);
  
  const newCourse = await runTest('Add Course', testAddCourse);
  await sleep(500);
  
  if (newCourse) {
    await runTest('Edit Course', testEditCourse, newCourse.course_id);
    await sleep(500);
  }

  // 4. Certificates Module
  let certificate = null;
  if (newStudent && newCourse) {
    certificate = await runTest(
      'Issue Certificate',
      testIssueCertificate,
      newStudent.student_id,
      newCourse.course_id
    );
    await sleep(500);
    
    if (certificate && certificate.csl_number) {
      await runTest('View Certificate', testViewCertificate, certificate);
      await sleep(500);
      
      await runTest('Generate Certificate PDF', testGenerateCertificatePDF, certificate.csl_number);
      await sleep(500);
      
      await runTest('Revoke Certificate', testRevokeCertificate, certificate);
      await sleep(500);
    }
  }

  // Cleanup - Delete course after certificate tests (if we created one)
  if (newCourse) {
    const hasCertificates = certificate && certificate.csl_number;
    await runTest('Delete Course', testDeleteCourse, newCourse.course_id, hasCertificates);
    await sleep(500);
  }

  // Cleanup - Soft delete student at the end
  if (newStudent) {
    await runTest('Soft Delete Student', testSoftDeleteStudent, newStudent.student_id);
  }

  // Print final summary
  printTestSummary(results);
}

function printTestSummary(results) {
  console.log('\n');
  console.log('='.repeat(80));
  console.log(`${colors.bright}${colors.magenta}TEST SUMMARY${colors.reset}`);
  console.log('='.repeat(80));
  console.log('\n');

  results.tests.forEach((test, index) => {
    const status = test.status === 'PASSED' 
      ? `${colors.green}✓ PASSED${colors.reset}` 
      : `${colors.red}✗ FAILED${colors.reset}`;
    console.log(`${index + 1}. ${test.name.padEnd(40)} ${status}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}Total Tests: ${results.total}${colors.reset}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  
  const successRate = ((results.passed / results.total) * 100).toFixed(2);
  console.log(`${colors.blue}Success Rate: ${successRate}%${colors.reset}`);
  console.log('='.repeat(80) + '\n');

  if (results.failed === 0) {
    console.log(`${colors.green}${colors.bright}🎉 ALL TESTS PASSED! 🎉${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}${colors.bright}⚠️  SOME TESTS FAILED - Please review the logs above${colors.reset}\n`);
  }
}

// Run the tests
if (require.main === module) {
  runComprehensiveTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
  });
}

module.exports = {
  runComprehensiveTests,
  testLogin,
  testAddStudent,
  testEditStudent,
  testAddCourse,
  testIssueCertificate
};
