#!/usr/bin/env node

/**
 * CSL Management System API Test Script
 * 
 * This script tests the main API endpoints to ensure everything is working correctly.
 * Run this after starting the backend server.
 */

const https = require('https');
const http = require('http');

const API_BASE = process.env.API_URL || 'http://localhost:5000/api/v1';
const TEST_EMAIL = 'admin@csl.com';
const TEST_PASSWORD = 'Admin@2025';

let accessToken = '';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ statusCode: res.statusCode, headers: res.headers, data: parsed });
        } catch (error) {
          resolve({ statusCode: res.statusCode, headers: res.headers, data: body });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    req.setTimeout(10000);

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testHealthCheck() {
  log('🏥 Testing Health Check...', 'blue');
  try {
    const response = await makeRequest('GET', '/health');
    if (response.statusCode === 200) {
      log('✅ Health check passed', 'green');
      log(`   Status: ${response.data.status}`, 'green');
      log(`   Environment: ${response.data.environment}`, 'green');
      return true;
    } else {
      log(`❌ Health check failed: ${response.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Health check error: ${error.message}`, 'red');
    return false;
  }
}

async function testLogin() {
  log('🔐 Testing Authentication...', 'blue');
  try {
    const response = await makeRequest('POST', '/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (response.statusCode === 200 && response.data.success) {
      accessToken = response.data.data.accessToken;
      log('✅ Login successful', 'green');
      log(`   Admin: ${response.data.data.admin.name}`, 'green');
      log(`   Role: ${response.data.data.admin.role}`, 'green');
      return true;
    } else {
      log(`❌ Login failed: ${response.statusCode} - ${response.data.message}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Login error: ${error.message}`, 'red');
    return false;
  }
}

async function testPublicVerification() {
  log('🔍 Testing Public Verification...', 'blue');
  
  // Test with invalid CSL format
  try {
    const response = await makeRequest('GET', '/verification/invalid-csl');
    if (response.statusCode === 400) {
      log('✅ Invalid CSL format validation works', 'green');
    } else {
      log('⚠️  Invalid CSL format validation may have issues', 'yellow');
    }
  } catch (error) {
    log(`❌ Verification error: ${error.message}`, 'red');
  }

  // Test verification stats (public endpoint)
  try {
    const response = await makeRequest('GET', '/verification/stats');
    if (response.statusCode === 200) {
      log('✅ Verification stats endpoint works', 'green');
      log(`   Total verifications today: ${response.data.data.total_verifications_today}`, 'green');
      log(`   Total certificates issued: ${response.data.data.total_certificates_issued}`, 'green');
      return true;
    } else {
      log(`❌ Verification stats failed: ${response.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Verification stats error: ${error.message}`, 'red');
    return false;
  }
}

async function testProtectedEndpoints() {
  if (!accessToken) {
    log('❌ No access token available for protected endpoint tests', 'red');
    return false;
  }

  log('🛡️  Testing Protected Endpoints...', 'blue');
  
  const headers = { 'Authorization': `Bearer ${accessToken}` };
  
  // Test students endpoint
  try {
    const response = await makeRequest('GET', '/students?limit=5', null, headers);
    if (response.statusCode === 200) {
      log('✅ Students endpoint works', 'green');
      log(`   Found ${response.data.data.students.length} students`, 'green');
    } else {
      log(`❌ Students endpoint failed: ${response.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Students endpoint error: ${error.message}`, 'red');
    return false;
  }

  // Test courses endpoint
  try {
    const response = await makeRequest('GET', '/courses?limit=5', null, headers);
    if (response.statusCode === 200) {
      log('✅ Courses endpoint works', 'green');
      log(`   Found ${response.data.data.courses.length} courses`, 'green');
    } else {
      log(`❌ Courses endpoint failed: ${response.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Courses endpoint error: ${error.message}`, 'red');
    return false;
  }

  // Test certificates endpoint
  try {
    const response = await makeRequest('GET', '/certificates?limit=5', null, headers);
    if (response.statusCode === 200) {
      log('✅ Certificates endpoint works', 'green');
      log(`   Found ${response.data.data.certificates.length} certificates`, 'green');
    } else {
      log(`❌ Certificates endpoint failed: ${response.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Certificates endpoint error: ${error.message}`, 'red');
    return false;
  }

  // Test admin dashboard
  try {
    const response = await makeRequest('GET', '/admin/dashboard', null, headers);
    if (response.statusCode === 200) {
      log('✅ Admin dashboard works', 'green');
      log(`   Active students: ${response.data.data.overview.active_students}`, 'green');
      log(`   Active certificates: ${response.data.data.overview.active_certificates}`, 'green');
    } else {
      log(`❌ Admin dashboard failed: ${response.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Admin dashboard error: ${error.message}`, 'red');
    return false;
  }

  return true;
}

async function runTests() {
  log('🚀 Starting CSL Management System API Tests', 'magenta');
  log('=' .repeat(50), 'magenta');
  
  const results = {
    health: false,
    auth: false,
    verification: false,
    protected: false
  };

  results.health = await testHealthCheck();
  log('');

  if (results.health) {
    results.auth = await testLogin();
    log('');

    results.verification = await testPublicVerification();
    log('');

    results.protected = await testProtectedEndpoints();
    log('');
  }

  // Summary
  log('📊 Test Results Summary', 'magenta');
  log('=' .repeat(50), 'magenta');
  
  const tests = [
    { name: 'Health Check', status: results.health },
    { name: 'Authentication', status: results.auth },
    { name: 'Public Verification', status: results.verification },
    { name: 'Protected Endpoints', status: results.protected }
  ];

  tests.forEach(test => {
    const status = test.status ? '✅ PASS' : '❌ FAIL';
    const color = test.status ? 'green' : 'red';
    log(`   ${test.name}: ${status}`, color);
  });

  const allPassed = tests.every(test => test.status);
  log('');
  
  if (allPassed) {
    log('🎉 All tests passed! CSL Management System API is working correctly.', 'green');
    process.exit(0);
  } else {
    log('💥 Some tests failed. Please check the backend configuration and database connection.', 'red');
    log('');
    log('Troubleshooting steps:', 'yellow');
    log('1. Ensure the backend server is running (npm run dev)', 'yellow');
    log('2. Check database connection (docker-compose ps postgres)', 'yellow');
    log('3. Verify seed data is loaded', 'yellow');
    log('4. Check backend logs for errors', 'yellow');
    process.exit(1);
  }
}

if (require.main === module) {
  runTests().catch(error => {
    log(`💥 Test runner error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runTests, makeRequest };
