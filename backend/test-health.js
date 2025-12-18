const http = require('http');

// Test if server is running
const testServer = () => {
  console.log('Testing CSL Backend Server...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/health',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Server is running! Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log('📋 Health Check Response:');
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('📋 Raw Response:', data);
      }
      process.exit(0);
    });
  });

  req.on('error', (err) => {
    console.log('❌ Server not responding:', err.message);
    console.log('💡 Make sure to run: npm run dev');
    process.exit(1);
  });

  req.on('timeout', () => {
    console.log('⏰ Request timed out');
    req.destroy();
    process.exit(1);
  });

  req.end();
};

// Wait a bit then test
setTimeout(testServer, 1000);
