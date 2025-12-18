console.log('Testing basic HTTP...');

const http = require('http');

// Create a simple test server
const testServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Basic HTTP working', path: req.url }));
});

testServer.listen(5002, () => {
  console.log('✅ Test server started on port 5002');
  
  // Test the server
  const req = http.get('http://localhost:5002/test', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('✅ Test response:', data);
      testServer.close(() => {
        console.log('✅ Test server closed');
        
        // Now check if main server is running on 5000
        console.log('\nTesting main server on port 5000...');
        const mainReq = http.get('http://localhost:5000/health', (mainRes) => {
          let mainData = '';
          mainRes.on('data', chunk => mainData += chunk);
          mainRes.on('end', () => {
            console.log('🎉 MAIN SERVER IS RUNNING!');
            console.log('📋 Response:', mainData);
            process.exit(0);
          });
        });
        
        mainReq.on('error', (err) => {
          console.log('❌ Main server not responding:', err.message);
          console.log('💡 Make sure npm run dev is running in backend directory');
          process.exit(1);
        });
        
        mainReq.setTimeout(3000, () => {
          console.log('⏰ Main server request timed out');
          mainReq.destroy();
          process.exit(1);
        });
      });
    });
  });
  
  req.on('error', (err) => {
    console.log('❌ Test server failed:', err.message);
    testServer.close();
    process.exit(1);
  });
});
