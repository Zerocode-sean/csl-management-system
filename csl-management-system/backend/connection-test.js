console.log('🔍 Testing Enhanced CSL Backend Connection');
console.log('==========================================');

const http = require('http');

// Test connection to the server
function testConnection() {
  console.log('Attempting to connect to localhost:5001...');
  
  const req = http.get('http://localhost:5001/health', (res) => {
    console.log(`✅ Connection successful! Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('\n📊 Server Response:');
        console.log('==================');
        console.log(`Status: ${response.status}`);
        console.log(`Version: ${response.version}`);
        console.log(`Message: ${response.message}`);
        console.log(`Environment: ${response.environment}`);
        console.log(`Uptime: ${response.uptime}s`);
        
        if (response.version === '2.0.0') {
          console.log('\n🎯 CONFIRMED: Enhanced Backend v2.0 is running!');
          
          // Now test some enhanced endpoints
          testEnhancedEndpoints();
        } else {
          console.log('\n⚠️  Different version detected');
        }
        
      } catch (e) {
        console.log('\n📋 Raw Response:');
        console.log(data);
      }
    });
  });
  
  req.on('error', (err) => {
    console.log(`❌ Connection failed: ${err.message}`);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure server is running: node enhanced-production-start.js');
    console.log('2. Check if port 5001 is available: netstat -an | findstr :5001');
    console.log('3. Try different port: set PORT=5002 && node enhanced-production-start.js');
  });
  
  req.setTimeout(5000, () => {
    console.log('⏰ Connection timeout');
    req.destroy();
  });
}

function testEnhancedEndpoints() {
  console.log('\n🧪 Testing Enhanced Endpoints:');
  console.log('==============================');
  
  const endpoints = [
    '/api/v1/students',
    '/api/v1/courses', 
    '/api/v1/certificates',
    '/api/v1/admin/dashboard'
  ];
  
  let completed = 0;
  
  endpoints.forEach((endpoint, index) => {
    setTimeout(() => {
      console.log(`${index + 1}. Testing ${endpoint}...`);
      
      const req = http.get(`http://localhost:5001${endpoint}`, (res) => {
        console.log(`   Status: ${res.statusCode} ${res.statusCode === 200 ? '✅' : '❌'}`);
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.data && Array.isArray(response.data)) {
              console.log(`   Data: ${response.data.length} items found`);
            } else if (response.message) {
              console.log(`   Message: ${response.message}`);
            }
          } catch (e) {
            console.log(`   Raw: ${data.substring(0, 100)}...`);
          }
          
          completed++;
          if (completed === endpoints.length) {
            console.log('\n🎉 Enhanced Backend Testing Complete!');
            console.log('\n🔗 Ready to use:');
            console.log('   • Students API: http://localhost:5001/api/v1/students');
            console.log('   • Courses API: http://localhost:5001/api/v1/courses'); 
            console.log('   • Certificates API: http://localhost:5001/api/v1/certificates');
            console.log('   • Admin Dashboard: http://localhost:5001/api/v1/admin/dashboard');
            console.log('\n🧪 Run full test suite: node enhanced-test-suite.js');
          }
        });
      });
      
      req.on('error', (err) => {
        console.log(`   ❌ Error: ${err.message}`);
        completed++;
      });
      
      req.setTimeout(3000, () => {
        console.log(`   ⏰ Timeout`);
        req.destroy();
        completed++;
      });
      
    }, index * 500); // Stagger requests by 500ms
  });
}

// Start the test
testConnection();
