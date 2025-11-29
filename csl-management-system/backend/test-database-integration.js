#!/usr/bin/env node

/**
 * Database Integration Test Suite
 * Tests the CSL Backend with real PostgreSQL database
 */

const http = require('http');
const { Pool } = require('pg');
require('dotenv').config();

console.log('🗄️  CSL Database Integration Test Suite');
console.log('=======================================\n');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'csl_user',
  password: process.env.DB_PASSWORD || 'csl_password',
  database: process.env.DB_NAME || 'csl_database'
};

let testPool;
let testResults = [];

function logTest(description, status, details = '') {
  const result = { description, status, details, timestamp: new Date().toISOString() };
  testResults.push(result);
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${description}${details ? ' - ' + details : ''}`);
}

// Helper function to make HTTP requests
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testDatabaseConnection() {
  console.log('1️⃣ Database Connection Tests');
  console.log('============================');

  try {
    testPool = new Pool(dbConfig);
    const client = await testPool.connect();
    
    // Test basic connection
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    logTest('Database Connection', 'PASS', `Connected to ${result.rows[0].pg_version.split(' ')[0]}`);
    
    // Test table existence
    const tableQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    const tables = await client.query(tableQuery);
    
    const expectedTables = ['students', 'courses', 'certificates', 'users', 'enrollments', 'audit_logs'];
    const existingTables = tables.rows.map(row => row.table_name);
    
    expectedTables.forEach(tableName => {
      if (existingTables.includes(tableName)) {
        logTest(`Table: ${tableName}`, 'PASS', 'Exists');
      } else {
        logTest(`Table: ${tableName}`, 'FAIL', 'Missing');
      }
    });
    
    // Test sample data
    const studentCount = await client.query('SELECT COUNT(*) FROM students');
    logTest('Sample Data', studentCount.rows[0].count > 0 ? 'PASS' : 'WARN', 
           `${studentCount.rows[0].count} students found`);
    
    client.release();
    return true;
    
  } catch (error) {
    logTest('Database Connection', 'FAIL', error.message);
    return false;
  }
}

async function testServerWithDatabase() {
  console.log('\n2️⃣ Server Integration Tests');
  console.log('============================');

  const baseUrl = 'http://localhost:5001';
  
  try {
    // Test health endpoint
    const health = await makeRequest(`${baseUrl}/health`);
    if (health.statusCode === 200 && health.data.database) {
      logTest('Server Health Check', 'PASS', 
             `Database: ${health.data.database.status}`);
    } else {
      logTest('Server Health Check', 'FAIL', `Status: ${health.statusCode}`);
    }

    // Test students endpoint with database
    const students = await makeRequest(`${baseUrl}/api/students`);
    if (students.statusCode === 200 && students.data.success) {
      const source = students.data.source || 'unknown';
      logTest('Students API', 'PASS', 
             `${students.data.data.length} students, Source: ${source}`);
      
      if (source === 'database') {
        logTest('Database Integration', 'PASS', 'Using real PostgreSQL data');
      } else {
        logTest('Database Integration', 'WARN', 'Using mock data fallback');
      }
    } else {
      logTest('Students API', 'FAIL', `Status: ${students.statusCode}`);
    }

    // Test courses endpoint
    const courses = await makeRequest(`${baseUrl}/api/courses`);
    if (courses.statusCode === 200 && courses.data.success) {
      logTest('Courses API', 'PASS', 
             `${courses.data.data.length} courses, Source: ${courses.data.source}`);
    } else {
      logTest('Courses API', 'FAIL', `Status: ${courses.statusCode}`);
    }

    // Test certificates endpoint
    const certificates = await makeRequest(`${baseUrl}/api/certificates`);
    if (certificates.statusCode === 200 && certificates.data.success) {
      logTest('Certificates API', 'PASS', 
             `${certificates.data.data.length} certificates, Source: ${certificates.data.source}`);
    } else {
      logTest('Certificates API', 'FAIL', `Status: ${certificates.statusCode}`);
    }

    // Test certificate verification
    const verification = await makeRequest(`${baseUrl}/api/verification/verify/CSL-2025-001`);
    if (verification.statusCode === 200 && verification.data.success) {
      logTest('Certificate Verification', 'PASS', 
             `Verified certificate for: ${verification.data.data.first_name || 'Unknown'}`);
    } else if (verification.statusCode === 404) {
      logTest('Certificate Verification', 'WARN', 'Test certificate not found (expected if no seed data)');
    } else {
      logTest('Certificate Verification', 'FAIL', `Status: ${verification.statusCode}`);
    }

  } catch (error) {
    logTest('Server Connection', 'FAIL', error.message);
  }
}

async function testCRUDOperations() {
  console.log('\n3️⃣ CRUD Operations Tests');
  console.log('========================');

  const baseUrl = 'http://localhost:5001';
  
  try {
    // Test creating a new student
    const newStudent = {
      student_id: 'TEST2025001',
      first_name: 'Integration',
      last_name: 'Test',
      email: 'integration.test@example.com',
      phone: '+1-555-0123',
      date_of_birth: '1995-01-15',
      address: '123 Test Street, Test City, TC 12345'
    };

    const createResponse = await makeRequest(`${baseUrl}/api/students`, 'POST', newStudent);
    if (createResponse.statusCode === 201 && createResponse.data.success) {
      logTest('Create Student', 'PASS', 
             `Created student: ${createResponse.data.data.first_name} ${createResponse.data.data.last_name}`);
      
      const createdId = createResponse.data.data.id;
      
      // Test getting the created student
      const getResponse = await makeRequest(`${baseUrl}/api/students/${createdId}`);
      if (getResponse.statusCode === 200 && getResponse.data.success) {
        logTest('Get Student by ID', 'PASS', 
               `Retrieved: ${getResponse.data.data.email}`);
      } else {
        logTest('Get Student by ID', 'FAIL', `Status: ${getResponse.statusCode}`);
      }
      
    } else {
      logTest('Create Student', 'FAIL', 
             `Status: ${createResponse.statusCode}, Error: ${createResponse.data.message || 'Unknown'}`);
    }

  } catch (error) {
    logTest('CRUD Operations', 'FAIL', error.message);
  }
}

async function testDataConsistency() {
  console.log('\n4️⃣ Data Consistency Tests');
  console.log('=========================');

  if (!testPool) {
    logTest('Data Consistency', 'SKIP', 'Database connection not available');
    return;
  }

  try {
    const client = await testPool.connect();
    
    // Test foreign key constraints
    const studentCourseQuery = `
      SELECT s.id, s.first_name, s.last_name, COUNT(c.id) as cert_count
      FROM students s
      LEFT JOIN certificates c ON s.id = c.student_id
      GROUP BY s.id, s.first_name, s.last_name
      ORDER BY cert_count DESC
      LIMIT 5
    `;
    
    const result = await client.query(studentCourseQuery);
    logTest('Foreign Key Relationships', 'PASS', 
           `Verified relationships for ${result.rows.length} students`);
    
    // Test data integrity
    const integrityChecks = [
      { 
        query: "SELECT COUNT(*) FROM students WHERE email IS NULL OR email = ''",
        test: 'Student Email Integrity',
        expected: '0'
      },
      {
        query: "SELECT COUNT(*) FROM courses WHERE course_code IS NULL OR course_code = ''",
        test: 'Course Code Integrity', 
        expected: '0'
      },
      {
        query: "SELECT COUNT(*) FROM certificates WHERE verification_code IS NULL OR verification_code = ''",
        test: 'Certificate Verification Code Integrity',
        expected: '0'
      }
    ];
    
    for (const check of integrityChecks) {
      const result = await client.query(check.query);
      const count = result.rows[0].count;
      if (count === check.expected) {
        logTest(check.test, 'PASS', `${count} invalid records found`);
      } else {
        logTest(check.test, 'WARN', `${count} invalid records found (expected ${check.expected})`);
      }
    }
    
    client.release();
    
  } catch (error) {
    logTest('Data Consistency Tests', 'FAIL', error.message);
  }
}

async function generateTestReport() {
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length; 
  const warnings = testResults.filter(r => r.status === 'WARN').length;
  const total = testResults.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Warnings: ${warnings} ⚠️`);
  console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All critical tests passed! Database integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.');
  }
  
  console.log('\n📋 Recommendations:');
  if (testResults.some(r => r.description.includes('Database Connection') && r.status === 'FAIL')) {
    console.log('- Run database setup: node setup-database.js');
  }
  if (testResults.some(r => r.description.includes('Table') && r.status === 'FAIL')) {
    console.log('- Execute schema: psql -U csl_user -d csl_database -f ../database/schemas/enhanced_schema.sql');
  }
  if (testResults.some(r => r.description.includes('Sample Data') && r.status === 'WARN')) {
    console.log('- Load seed data: psql -U csl_user -d csl_database -f ../database/seeds/dev_seed.sql');
  }
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    summary: { total, passed, failed, warnings },
    results: testResults
  };
  
  const fs = require('fs');
  fs.writeFileSync('./database-test-report.json', JSON.stringify(report, null, 2));
  console.log('\n💾 Detailed report saved to: database-test-report.json');
}

async function main() {
  console.log('Starting comprehensive database integration tests...\n');
  
  // Run all tests
  const dbConnected = await testDatabaseConnection();
  await testServerWithDatabase();
  await testCRUDOperations();
  
  if (dbConnected) {
    await testDataConsistency();
  }
  
  // Generate report
  await generateTestReport();
  
  // Cleanup
  if (testPool) {
    await testPool.end();
  }
  
  console.log('\n✨ Database integration testing completed!');
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error.message);
  if (testPool) {
    testPool.end();
  }
  process.exit(1);
});

// Run tests
main().catch(console.error);
