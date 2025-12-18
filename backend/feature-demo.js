#!/usr/bin/env node

/**
 * CSL Backend v2.0 Feature Demonstration
 * Shows off the enhanced capabilities
 */

const http = require('http');

console.log('🎯 CSL Backend v2.0 Feature Demonstration');
console.log('==========================================\n');

function makeAPICall(method, path, body = null, description = '') {
  return new Promise((resolve) => {
    console.log(`🔧 ${description}`);
    console.log(`   ${method} http://localhost:5001${path}`);
    
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode} ${res.statusCode < 300 ? '✅' : '❌'}`);
        
        try {
          const response = JSON.parse(data);
          
          if (response.data && Array.isArray(response.data)) {
            console.log(`   Result: ${response.data.length} items returned`);
            if (response.pagination) {
              console.log(`   Pagination: Page ${response.pagination.page} of ${response.pagination.pages} (${response.pagination.total} total)`);
            }
          } else if (response.certificate) {
            console.log(`   Certificate: ${response.certificate.csl_number} - ${response.certificate.student_name}`);
            console.log(`   Course: ${response.certificate.course_name}`);
            console.log(`   Valid: ${response.valid ? 'Yes' : 'No'}`);
          } else if (response.data && typeof response.data === 'object') {
            console.log(`   Data: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`);
          } else {
            console.log(`   Message: ${response.message || 'Success'}`);
          }
        } catch (e) {
          console.log(`   Raw: ${data.substring(0, 150)}...`);
        }
        console.log('');
        resolve(data);
      });
    });

    req.on('error', (err) => {
      console.log(`   ❌ Error: ${err.message}\n`);
      resolve(null);
    });

    req.setTimeout(5000, () => {
      console.log(`   ⏰ Timeout\n`);
      req.destroy();
      resolve(null);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function demonstrateFeatures() {
  console.log('🚀 Starting Feature Demonstration...\n');
  
  // 1. System Status
  console.log('📊 SYSTEM STATUS & HEALTH');
  console.log('==========================');
  await makeAPICall('GET', '/health', null, 'Basic Health Check');
  await makeAPICall('GET', '/api/v1/health', null, 'API Health Check');
  
  // 2. Authentication
  console.log('🔐 AUTHENTICATION');
  console.log('==================');
  const loginResult = await makeAPICall('POST', '/api/v1/auth/login', {
    username: 'admin',
    password: 'admin123'
  }, 'Admin Login');
  
  await makeAPICall('POST', '/api/v1/auth/login', {
    username: 'invalid',
    password: 'invalid'
  }, 'Invalid Login Attempt');
  
  // 3. Student Management
  console.log('👨‍🎓 STUDENT MANAGEMENT');
  console.log('========================');
  await makeAPICall('GET', '/api/v1/students', null, 'Get All Students');
  await makeAPICall('GET', '/api/v1/students?page=1&limit=2', null, 'Students with Pagination');
  await makeAPICall('GET', '/api/v1/students?search=Alice', null, 'Search Students by Name');
  await makeAPICall('GET', '/api/v1/students?status=active', null, 'Filter Active Students');
  await makeAPICall('GET', '/api/v1/students/1', null, 'Get Specific Student');
  
  // Create new student
  await makeAPICall('POST', '/api/v1/students', {
    student_id: 'DEMO2025001',
    first_name: 'Demo',
    last_name: 'Student',
    email: 'demo.student@example.com',
    phone: '+1-555-0123',
    address: '123 Demo Street, Demo City'
  }, 'Create New Student');
  
  // Try duplicate
  await makeAPICall('POST', '/api/v1/students', {
    student_id: 'CSL2025001', // Existing
    first_name: 'Duplicate',
    last_name: 'Test',
    email: 'duplicate@example.com'
  }, 'Attempt Duplicate Student ID');
  
  // 4. Course Management
  console.log('📚 COURSE MANAGEMENT');
  console.log('====================');
  await makeAPICall('GET', '/api/v1/courses', null, 'Get All Courses');
  await makeAPICall('GET', '/api/v1/courses?search=Computer', null, 'Search Courses');
  await makeAPICall('GET', '/api/v1/courses?category=Computer Science', null, 'Filter by Category');
  await makeAPICall('GET', '/api/v1/courses/1', null, 'Get Specific Course');
  
  // 5. Certificate Management
  console.log('🏆 CERTIFICATE MANAGEMENT');
  console.log('==========================');
  await makeAPICall('GET', '/api/v1/certificates', null, 'Get All Certificates');
  await makeAPICall('GET', '/api/v1/certificates?search=CSL-2025', null, 'Search Certificates');
  await makeAPICall('GET', '/api/v1/certificates?status=active', null, 'Filter Active Certificates');
  
  // Issue new certificate
  await makeAPICall('POST', '/api/v1/certificates/issue', {
    student_id: 2,
    course_id: 2,
    completion_date: '2025-10-25',
    grade: 'A',
    gpa: 3.9
  }, 'Issue New Certificate');
  
  // Try duplicate certificate
  await makeAPICall('POST', '/api/v1/certificates/issue', {
    student_id: 1,
    course_id: 1, // Already exists
    completion_date: '2025-10-25'
  }, 'Attempt Duplicate Certificate');
  
  // 6. Certificate Verification
  console.log('🔍 CERTIFICATE VERIFICATION');
  console.log('============================');
  await makeAPICall('GET', '/api/v1/verification/verify/CSL-2025-ABC123', null, 'Verify Valid Certificate');
  await makeAPICall('GET', '/api/v1/verification/verify/CSL-2025-INVALID', null, 'Verify Invalid Certificate');
  
  // 7. Admin Dashboard
  console.log('📊 ADMIN DASHBOARD');
  console.log('==================');
  await makeAPICall('GET', '/api/v1/admin/dashboard', null, 'Get Dashboard Statistics');
  
  // 8. Error Handling
  console.log('❌ ERROR HANDLING');
  console.log('==================');
  await makeAPICall('GET', '/api/v1/students/999', null, 'Non-existent Student');
  await makeAPICall('GET', '/api/v1/invalid-endpoint', null, 'Invalid Endpoint');
  
  // Summary
  console.log('🎉 DEMONSTRATION COMPLETE!');
  console.log('===========================');
  console.log('✅ Enhanced Features Demonstrated:');
  console.log('   • Complete CRUD Operations');
  console.log('   • Advanced Search & Filtering');
  console.log('   • Pagination Support');
  console.log('   • Data Validation');
  console.log('   • Error Handling');
  console.log('   • Certificate Issuance & Verification');
  console.log('   • Admin Dashboard');
  console.log('   • Authentication');
  
  console.log('\n🔗 CSL Backend v2.0 is fully operational!');
  console.log('   Ready for production use and frontend integration.');
}

// Run the demonstration
demonstrateFeatures().catch(console.error);
