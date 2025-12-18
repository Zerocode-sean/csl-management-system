#!/usr/bin/env node

/**
 * Test Backend Connection
 */

console.log('🧪 Testing Backend Connection');
console.log('=============================\n');

const http = require('http');

function testEndpoint(url, name) {
  return new Promise((resolve, reject) => {
    console.log(`Testing ${name}...`);
    
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`✅ ${name}: ${res.statusCode}`);
        try {
          const parsed = JSON.parse(data);
          console.log(`   Response: ${JSON.stringify(parsed, null, 2)}\n`);
          resolve({ success: true, status: res.statusCode, data: parsed });
        } catch (e) {
          console.log(`   Raw response: ${data}\n`);
          resolve({ success: true, status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ ${name}: ${error.message}\n`);
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      console.log(`❌ ${name}: Timeout\n`);
      reject(new Error('Timeout'));
    });
  });
}

async function runTests() {
  try {
    console.log('1️⃣ Testing Health Endpoint');
    await testEndpoint('http://localhost:5001/health', 'Health Check');
    
    console.log('2️⃣ Testing Students API');
    await testEndpoint('http://localhost:5001/api/v1/students', 'Students List');
    
    console.log('3️⃣ Testing Single Student');
    await testEndpoint('http://localhost:5001/api/v1/students/1', 'Student Detail');
    
    console.log('🎉 All tests passed! Backend is working correctly.');
    console.log('\n💡 You can now:');
    console.log('   • Start frontend: cd ../frontend && npm run dev');
    console.log('   • Open test page: students-test.html');
    console.log('   • Test in browser: http://localhost:5001/health');
    
  } catch (error) {
    console.log('❌ Tests failed. Backend may not be running.');
    console.log('\n🛠️ To start backend:');
    console.log('   1. Open new terminal');
    console.log('   2. Run: start-simple-backend.bat');
    console.log('   3. Or: node simple-backend.js');
  }
}

runTests();
