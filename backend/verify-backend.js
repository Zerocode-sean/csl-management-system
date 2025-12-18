const http = require('http');

console.log('🔍 Quick CSL Backend Verification');
console.log('=================================\n');

// Test the health endpoint
const testHealth = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.message && parsed.message.includes('CSL')) {
            console.log('✅ CSL Backend is running correctly!');
            console.log('📋 Response:', JSON.stringify(parsed, null, 2));
            resolve(true);
          } else {
            console.log('❌ Different server is running (not CSL backend)');
            console.log('📋 Response:', JSON.stringify(parsed, null, 2));
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Invalid JSON response');
          console.log('📋 Raw response:', data);
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Connection failed:', err.message);
      resolve(false);
    });
    
    req.setTimeout(3000, () => {
      console.log('⏰ Request timeout');
      req.destroy();
      resolve(false);
    });
  });
};

// Test API endpoint
const testAPI = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/api/v1/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ API endpoint working!');
          try {
            const parsed = JSON.parse(data);
            console.log('📋 API Response:', JSON.stringify(parsed, null, 2));
          } catch (e) {
            console.log('📋 API Raw response:', data);
          }
          resolve(true);
        } else {
          console.log(`❌ API endpoint failed (${res.statusCode})`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ API connection failed:', err.message);
      resolve(false);
    });
    
    req.setTimeout(3000, () => {
      console.log('⏰ API request timeout');
      req.destroy();
      resolve(false);
    });
  });
};

// Run tests
(async () => {
  console.log('Testing /health endpoint...');
  const healthOk = await testHealth();
  
  console.log('\nTesting /api/v1/health endpoint...');
  const apiOk = await testAPI();
  
  console.log('\n' + '='.repeat(40));
  if (healthOk && apiOk) {
    console.log('🎉 CSL Backend is working perfectly!');
    console.log('\n🔗 Available endpoints:');
    console.log('   • http://localhost:5000/health');
    console.log('   • http://localhost:5000/api/v1/health');
    console.log('   • http://localhost:5000/api/v1/auth/login (POST)');
    console.log('   • http://localhost:5000/api/v1/verification/verify/CSL123');
  } else {
    console.log('⚠️  Backend verification failed');
    console.log('💡 Try restarting: node production-start.js');
  }
})();
