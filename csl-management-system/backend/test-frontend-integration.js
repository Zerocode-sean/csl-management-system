#!/usr/bin/env node

/**
 * Frontend Integration Test
 */

console.log('🧪 Frontend Integration Test');
console.log('============================\n');

const http = require('http');

async function testFrontendAPI() {
  // Test if backend API is accessible
  console.log('1️⃣ Testing Backend API Connection');
  console.log('==================================');
  
  try {
    await testEndpoint('http://localhost:5001/health', 'Health Check');
    await testEndpoint('http://localhost:5001/api/v1/students', 'Students API');
    console.log('✅ Backend API: All endpoints working\n');
  } catch (error) {
    console.log('❌ Backend API: Failed -', error.message);
    return false;
  }

  // Test frontend server
  console.log('2️⃣ Testing Frontend Server');
  console.log('===========================');
  
  const frontendPorts = [3000, 5173, 5174, 8080];
  let frontendRunning = false;
  
  for (const port of frontendPorts) {
    try {
      const result = await testEndpoint(`http://localhost:${port}`, `Frontend on port ${port}`);
      if (result) {
        console.log(`✅ Frontend: Running on http://localhost:${port}\n`);
        frontendRunning = true;
        break;
      }
    } catch (error) {
      // Port not available, continue
    }
  }
  
  if (!frontendRunning) {
    console.log('❌ Frontend: Not running on any expected port');
    console.log('   Try running: npm run dev\n');
  }

  return true;
}

function testEndpoint(url, name) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      console.log(`✅ ${name}: ${res.statusCode}`);
      resolve(true);
    });
    
    req.on('error', (error) => {
      console.log(`❌ ${name}: ${error.message}`);
      reject(error);
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

console.log('🔍 Component File Check');
console.log('=======================');

const fs = require('fs');
const path = require('path');

// Check if our enhanced files exist
const filesToCheck = [
  '../frontend/src/services/studentsService.ts',
  '../frontend/src/pages/students/StudentsPage.tsx',
  '../frontend/.env'
];

filesToCheck.forEach(file => {
  const fullPath = path.resolve(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file}: Exists`);
  } else {
    console.log(`❌ ${file}: Missing`);
  }
});

console.log('\n');
testFrontendAPI();
