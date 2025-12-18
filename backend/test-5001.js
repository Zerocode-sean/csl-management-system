const http = require('http');

console.log('🧪 Testing CSL Backend on Port 5001');
console.log('===================================\n');

const testEndpoint = (path, expectedStatus = 200) => {
  return new Promise((resolve) => {
    console.log(`Testing: ${path}`);
    
    const req = http.get(`http://localhost:5001${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const success = res.statusCode === expectedStatus;
        console.log(`Status: ${res.statusCode} ${success ? '✅' : '❌'}`);
        
        try {
          const parsed = JSON.parse(data);
          console.log('Response:', JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log('Response (text):', data.substring(0, 200));
        }
        console.log('');
        resolve(success);
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ Error: ${err.message}\n`);
      resolve(false);
    });
    
    req.setTimeout(3000, () => {
      console.log('⏰ Timeout\n');
      req.destroy();
      resolve(false);
    });
  });
};

const runTests = async () => {
  let passed = 0;
  const tests = [
    ['/health', 200],
    ['/api/v1/health', 200],
    ['/', 200]
  ];
  
  for (const [path, expectedStatus] of tests) {
    if (await testEndpoint(path, expectedStatus)) {
      passed++;
    }
  }
  
  console.log('='.repeat(40));
  console.log(`Results: ${passed}/${tests.length} tests passed`);
  
  if (passed === tests.length) {
    console.log('🎉 CSL Backend is working perfectly on port 5001!');
    console.log('\n🔗 Available URLs:');
    console.log('   • Health: http://localhost:5001/health');
    console.log('   • API: http://localhost:5001/api/v1/health');
    console.log('   • Login: POST http://localhost:5001/api/v1/auth/login');
    console.log('   • Verify: http://localhost:5001/api/v1/verification/verify/CSL123');
  } else {
    console.log('❌ Some tests failed. Server may not be running.');
  }
};

runTests();
