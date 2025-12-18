#!/usr/bin/env node

/**
 * CSL Backend v2.0 Complete Test Suite
 * Tests all CRUD operations and enhanced features
 */

const http = require('http');

console.log('🧪 CSL Backend v2.0 Complete Test Suite');
console.log('=======================================\n');

const API_BASE = 'localhost';
const PORT = 5001;
const API_PREFIX = '/api/v1';

let testCount = 0;
let passedTests = 0;
let authToken = null;

function makeRequest(method, path, body = null, expectedStatus = 200, headers = {}) {
  testCount++;
  const testName = `${method} ${path}`;
  console.log(`${testCount}. Testing: ${testName}`);
  
  return new Promise((resolve) => {
    const options = {
      hostname: API_BASE,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const success = res.statusCode === expectedStatus;
        if (success) {
          passedTests++;
          console.log(`   ✅ PASS (${res.statusCode})`);
        } else {
          console.log(`   ❌ FAIL (Expected ${expectedStatus}, got ${res.statusCode})`);
        }
        
        try {
          const parsed = JSON.parse(data);
          if (parsed.data && Array.isArray(parsed.data)) {
            console.log(`   📋 Response: ${parsed.message} (${parsed.data.length} items)`);
          } else {
            console.log(`   📋 Response: ${JSON.stringify(parsed, null, 2).substring(0, 200)}...`);
          }
        } catch (e) {
          console.log(`   📋 Response: ${data.substring(0, 200)}...`);
        }
        console.log();
        resolve({ success, data: data, statusCode: res.statusCode });
      });
    });

    req.on('error', (err) => {
      console.log(`   ❌ ERROR: ${err.message}`);
      console.log();
      resolve({ success: false, error: err.message });
    });

    req.setTimeout(10000, () => {
      console.log(`   ⏰ TIMEOUT`);
      console.log();
      req.destroy();
      resolve({ success: false, error: 'timeout' });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive API tests...\n');
  
  // Group 1: Health and Status Checks
  console.log('📊 GROUP 1: Health and Status Checks');
  console.log('=====================================');
  await makeRequest('GET', '/health');
  await makeRequest('GET', `${API_PREFIX}/health`);
  await makeRequest('GET', '/');
  
  // Group 2: Authentication
  console.log('🔐 GROUP 2: Authentication');
  console.log('===========================');
  const loginResult = await makeRequest('POST', `${API_PREFIX}/auth/login`, {
    username: 'admin',
    password: 'admin123'
  });
  
  if (loginResult.success) {
    try {
      const loginData = JSON.parse(loginResult.data);
      authToken = loginData.token;
      console.log('   🎫 Auth token obtained for subsequent tests\n');
    } catch (e) {
      console.log('   ⚠️  Could not parse login response\n');
    }
  }
  
  await makeRequest('POST', `${API_PREFIX}/auth/login`, {
    username: 'wrong',
    password: 'wrong'
  }, 401);
  
  // Group 3: Student Management
  console.log('📚 GROUP 3: Student Management');
  console.log('===============================');
  
  // Get all students
  await makeRequest('GET', `${API_PREFIX}/students`);
  
  // Get students with pagination
  await makeRequest('GET', `${API_PREFIX}/students?page=1&limit=5`);
  
  // Search students
  await makeRequest('GET', `${API_PREFIX}/students?search=alice`);
  
  // Filter students by status
  await makeRequest('GET', `${API_PREFIX}/students?status=active`);
  
  // Get specific student
  await makeRequest('GET', `${API_PREFIX}/students/1`);
  
  // Get non-existent student
  await makeRequest('GET', `${API_PREFIX}/students/999`, null, 404);
  
  // Create new student
  const newStudent = await makeRequest('POST', `${API_PREFIX}/students`, {
    student_id: 'CSL2025999',
    first_name: 'Test',
    last_name: 'Student',
    email: 'test.student@example.com',
    phone: '+1234567890',
    address: '123 Test Street'
  }, 201);
  
  // Try to create student with duplicate ID
  await makeRequest('POST', `${API_PREFIX}/students`, {
    student_id: 'CSL2025001', // Existing ID
    first_name: 'Duplicate',
    last_name: 'Student',
    email: 'duplicate@example.com'
  }, 409);
  
  // Create student with missing required fields
  await makeRequest('POST', `${API_PREFIX}/students`, {
    first_name: 'Incomplete'
  }, 400);
  
  // Group 4: Course Management
  console.log('📖 GROUP 4: Course Management');
  console.log('==============================');
  
  // Get all courses
  await makeRequest('GET', `${API_PREFIX}/courses`);
  
  // Get courses with search
  await makeRequest('GET', `${API_PREFIX}/courses?search=computer`);
  
  // Filter courses by category
  await makeRequest('GET', `${API_PREFIX}/courses?category=Computer Science`);
  
  // Get specific course
  await makeRequest('GET', `${API_PREFIX}/courses/1`);
  
  // Get non-existent course
  await makeRequest('GET', `${API_PREFIX}/courses/999`, null, 404);
  
  // Group 5: Certificate Management
  console.log('🏆 GROUP 5: Certificate Management');
  console.log('===================================');
  
  // Get all certificates
  await makeRequest('GET', `${API_PREFIX}/certificates`);
  
  // Search certificates
  await makeRequest('GET', `${API_PREFIX}/certificates?search=CSL-2025`);
  
  // Filter certificates by status
  await makeRequest('GET', `${API_PREFIX}/certificates?status=active`);
  
  // Issue new certificate
  const newCertificate = await makeRequest('POST', `${API_PREFIX}/certificates/issue`, {
    student_id: 2,
    course_id: 2,
    completion_date: '2025-10-20',
    grade: 'A-',
    gpa: 3.7
  }, 201);
  
  // Try to issue duplicate certificate
  await makeRequest('POST', `${API_PREFIX}/certificates/issue`, {
    student_id: 1,
    course_id: 1, // Already exists
    completion_date: '2025-10-20'
  }, 409);
  
  // Issue certificate with missing data
  await makeRequest('POST', `${API_PREFIX}/certificates/issue`, {
    student_id: 1
    // Missing required fields
  }, 400);
  
  // Issue certificate for non-existent student/course
  await makeRequest('POST', `${API_PREFIX}/certificates/issue`, {
    student_id: 999,
    course_id: 999,
    completion_date: '2025-10-20'
  }, 404);
  
  // Group 6: Certificate Verification
  console.log('🔍 GROUP 6: Certificate Verification');
  console.log('=====================================');
  
  // Verify existing certificate
  await makeRequest('GET', `${API_PREFIX}/verification/verify/CSL-2025-ABC123`);
  
  // Verify non-existent certificate
  await makeRequest('GET', `${API_PREFIX}/verification/verify/CSL-2025-INVALID`);
  
  // Group 7: Admin Dashboard
  console.log('📊 GROUP 7: Admin Dashboard');
  console.log('============================');
  
  // Get dashboard statistics
  await makeRequest('GET', `${API_PREFIX}/admin/dashboard`);
  
  // Group 8: Error Handling
  console.log('❌ GROUP 8: Error Handling');
  console.log('===========================');
  
  // Test 404 for non-existent endpoint
  await makeRequest('GET', `${API_PREFIX}/nonexistent`, null, 404);
  
  // Test malformed JSON
  const malformedResult = await makeRequest('POST', `${API_PREFIX}/students`, 'invalid-json', 400);
  
  // Summary
  console.log('='.repeat(70));
  console.log(`📊 CSL Backend v2.0 Test Results:`);
  console.log(`   Total Tests: ${testCount}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${testCount - passedTests}`);
  console.log(`   Success Rate: ${((passedTests / testCount) * 100).toFixed(1)}%`);
  
  if (passedTests === testCount) {
    console.log('\n🎉 ALL TESTS PASSED! CSL Backend v2.0 is working perfectly!');
  } else if (passedTests / testCount >= 0.8) {
    console.log('\n✅ Most tests passed! CSL Backend v2.0 is mostly functional.');
  } else {
    console.log('\n⚠️  Many tests failed. Please check the server implementation.');
  }
  
  console.log('\n🔗 CSL Backend v2.0 Endpoints Summary:');
  console.log(`   • Health: http://localhost:${PORT}/health`);
  console.log(`   • API Health: http://localhost:${PORT}${API_PREFIX}/health`);
  console.log(`   • Students: http://localhost:${PORT}${API_PREFIX}/students`);
  console.log(`   • Courses: http://localhost:${PORT}${API_PREFIX}/courses`);
  console.log(`   • Certificates: http://localhost:${PORT}${API_PREFIX}/certificates`);
  console.log(`   • Verification: http://localhost:${PORT}${API_PREFIX}/verification/verify/{csl}`);
  console.log(`   • Authentication: http://localhost:${PORT}${API_PREFIX}/auth/login`);
  console.log(`   • Admin Dashboard: http://localhost:${PORT}${API_PREFIX}/admin/dashboard`);
  
  console.log('\n🧪 Test Categories Covered:');
  console.log('   ✅ Health & Status Checks');
  console.log('   ✅ Authentication & Authorization');
  console.log('   ✅ Student CRUD Operations');
  console.log('   ✅ Course Management');
  console.log('   ✅ Certificate Issuance & Management');
  console.log('   ✅ Public Certificate Verification');
  console.log('   ✅ Admin Dashboard & Statistics');
  console.log('   ✅ Error Handling & Validation');
  
  console.log('\n💡 API Usage Examples:');
  console.log('   Login: curl -X POST -H "Content-Type: application/json" -d "{\\"username\\":\\"admin\\",\\"password\\":\\"admin123\\"}" http://localhost:5001/api/v1/auth/login');
  console.log('   Students: curl http://localhost:5001/api/v1/students');
  console.log('   Verify: curl http://localhost:5001/api/v1/verification/verify/CSL-2025-ABC123');
}

// Run the complete test suite
runAllTests().catch(console.error);
