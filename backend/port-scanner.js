const http = require('http');

console.log('🔍 CSL Backend Port Scanner & Verifier');
console.log('=====================================\n');

const testPort = (port) => {
  return new Promise((resolve) => {
    console.log(`Testing port ${port}...`);
    
    const req = http.get(`http://localhost:${port}/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`✅ Port ${port} is responding`);
          
          // Check if it's our CSL backend
          if (parsed.message && (parsed.message.includes('CSL') || parsed.message.includes('EMESA'))) {
            console.log(`🎯 Found CSL Backend on port ${port}!`);
            console.log(`📋 Response: ${JSON.stringify(parsed, null, 2)}`);
            resolve({ port, isCsl: true, data: parsed });
          } else {
            console.log(`⚠️  Port ${port} has different service: ${parsed.message || 'Unknown'}`);
            resolve({ port, isCsl: false, data: parsed });
          }
        } catch (e) {
          console.log(`⚠️  Port ${port} returned non-JSON: ${data.substring(0, 100)}...`);
          resolve({ port, isCsl: false, data: data });
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ Port ${port} not responding: ${err.message}`);
      resolve({ port, isCsl: false, error: err.message });
    });
    
    req.setTimeout(2000, () => {
      console.log(`⏰ Port ${port} timeout`);
      req.destroy();
      resolve({ port, isCsl: false, error: 'timeout' });
    });
  });
};

const testApiEndpoint = (port) => {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/v1/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`📡 API endpoint test on port ${port}: ${res.statusCode}`);
        resolve(res.statusCode === 200);
      });
    });
    
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
  });
};

// Test common ports
(async () => {
  const ports = [5000, 5001, 3000, 8000];
  let cslFound = false;
  
  for (const port of ports) {
    const result = await testPort(port);
    if (result.isCsl) {
      cslFound = true;
      console.log(`\n🎉 CSL Backend found on port ${port}!`);
      
      // Test API endpoint
      const apiWorks = await testApiEndpoint(port);
      console.log(`🔌 API endpoints: ${apiWorks ? '✅ Working' : '❌ Not working'}`);
      
      console.log(`\n🔗 CSL Backend URLs (port ${port}):`);
      console.log(`   • Health: http://localhost:${port}/health`);
      console.log(`   • API Health: http://localhost:${port}/api/v1/health`);
      console.log(`   • Login: http://localhost:${port}/api/v1/auth/login (POST)`);
      console.log(`   • Verify: http://localhost:${port}/api/v1/verification/verify/TEST123`);
      break;
    }
    console.log('');
  }
  
  if (!cslFound) {
    console.log('❌ CSL Backend not found on any common ports');
    console.log('\n💡 To start CSL Backend:');
    console.log('   1. Kill other processes: taskkill /f /im node.exe');
    console.log('   2. Start on port 5001: set PORT=5001 && node production-start.js');
    console.log('   3. Or use TypeScript: npm run dev');
  }
})();
