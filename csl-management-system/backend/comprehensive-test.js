#!/usr/bin/env node

/**
 * CSL Backend API Test Suite
 * Comprehensive testing of all endpoints
 */

const http = require('http');

console.log('🧪 CSL Backend API Test Suite');
console.log('==============================\n');

const API_BASE = 'localhost';
const PORT = 5000;
const API_PREFIX = '/api/v1';

// Test counter
let testCount = 0;
let passedTests = 0;

function runTest(name, method, path, body = null, expectedStatus = 200) {
  testCount++;
  console.log(`${testCount}. Testing: ${name}`);
  
  return new Promise((resolve) => {
    const options = {
      hostname: API_BASE,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
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
          console.log(`   📋 Response: ${JSON.stringify(parsed, null, 2).substring(0, 200)}...`);
        } catch (e) {
          console.log(`   📋 Response: ${data.substring(0, 200)}...`);
        }
        console.log();
        resolve(success);
      });
    });

    req.on('error', (err) => {
      console.log(`   ❌ ERROR: ${err.message}`);
      console.log();
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.log(`   ⏰ TIMEOUT`);
      console.log();
      req.destroy();
      resolve(false);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function runAllTests() {
  console.log('Starting API tests...\n');

  // Test 1: Basic health check
  await runTest('Basic Health Check', 'GET', '/health');

  // Test 2: API health check
  await runTest('API Health Check', 'GET', `${API_PREFIX}/health`);

  // Test 3: Root endpoint
  await runTest('Root Endpoint', 'GET', '/');

  // Test 4: Login with valid credentials
  await runTest('Valid Login', 'POST', `${API_PREFIX}/auth/login`, {
    username: 'admin',
    password: 'admin123'
  });

  // Test 5: Login with invalid credentials
  await runTest('Invalid Login', 'POST', `${API_PREFIX}/auth/login`, {
    username: 'wrong',
    password: 'wrong'
  }, 401);

  // Test 6: Certificate verification
  await runTest('Certificate Verification', 'GET', `${API_PREFIX}/verification/verify/CSL123`);

  // Test 7: Not found endpoint
  await runTest('404 Not Found', 'GET', '/nonexistent', null, 404);

  // Summary
  console.log('='.repeat(50));
  console.log(`📊 Test Summary:`);
  console.log(`   Total Tests: ${testCount}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${testCount - passedTests}`);
  console.log(`   Success Rate: ${((passedTests / testCount) * 100).toFixed(1)}%`);

  if (passedTests === testCount) {
    console.log('\n🎉 ALL TESTS PASSED! Backend is working perfectly!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the server logs for details.');
  }

  console.log('\n🔗 Quick Test URLs:');
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   API: http://localhost:${PORT}${API_PREFIX}/health`);
  console.log(`   Verify: http://localhost:${PORT}${API_PREFIX}/verification/verify/TEST123`);
}

// Run tests
runAllTests().catch(console.error);
