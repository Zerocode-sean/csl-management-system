const http = require('http');

console.log('🔍 Enhanced CSL Backend Quick Verification');
console.log('==========================================\n');

async function testEndpoint(path, description) {
  return new Promise((resolve) => {
    console.log(`Testing: ${description}`);
    console.log(`URL: http://localhost:5001${path}`);
    
    const req = http.get(`http://localhost:5001${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode} ${res.statusCode === 200 ? '✅' : '❌'}`);
        
        try {
          const parsed = JSON.parse(data);
          if (parsed.version === '2.0.0') {
            console.log('🎯 Enhanced Backend v2.0 detected!');
          }
          console.log(`Response: ${JSON.stringify(parsed, null, 2).substring(0, 300)}...`);
        } catch (e) {
          console.log(`Response: ${data.substring(0, 200)}...`);
        }
        console.log('');
        resolve(res.statusCode === 200);
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ Error: ${err.message}`);
      console.log('💡 Make sure server is running: node enhanced-production-start.js\n');
      resolve(false);
    });
    
    req.setTimeout(3000, () => {
      console.log('⏰ Timeout\n');
      req.destroy();
      resolve(false);
    });
  });
}

async function runQuickTests() {
  const tests = [
    ['/', 'Root Endpoint'],
    ['/health', 'Basic Health Check'],
    ['/api/v1/health', 'API Health Check'],
    ['/api/v1/students', 'Students List'],
    ['/api/v1/courses', 'Courses List'],
    ['/api/v1/certificates', 'Certificates List'],
    ['/api/v1/admin/dashboard', 'Admin Dashboard']
  ];
  
  let passed = 0;
  
  for (const [path, description] of tests) {
    if (await testEndpoint(path, description)) {
      passed++;
    }
  }
  
  console.log('='.repeat(50));
  console.log(`Results: ${passed}/${tests.length} endpoints working`);
  
  if (passed === tests.length) {
    console.log('🎉 Enhanced CSL Backend v2.0 is fully operational!');
    
    console.log('\n🚀 Ready for comprehensive testing:');
    console.log('   node enhanced-test-suite.js');
    
    console.log('\n📱 Browser Testing:');
    console.log('   • Health: http://localhost:5001/health');
    console.log('   • Students: http://localhost:5001/api/v1/students');
    console.log('   • Certificates: http://localhost:5001/api/v1/certificates');
    console.log('   • Admin: http://localhost:5001/api/v1/admin/dashboard');
    
  } else {
    console.log('⚠️  Some endpoints failed. Server may still be starting.');
    console.log('💡 Wait a moment and try again, or check server logs.');
  }
}

runQuickTests();
