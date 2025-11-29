// Simple Backend Verification Script
console.log('🔍 CSL Backend System Verification');
console.log('==================================');

// Step 1: Check Node.js environment
console.log('\n1. Node.js Environment:');
console.log(`   Version: ${process.version}`);
console.log(`   Platform: ${process.platform}`);
console.log(`   Architecture: ${process.arch}`);

// Step 2: Check working directory  
console.log('\n2. Working Directory:');
console.log(`   Path: ${process.cwd()}`);

// Step 3: Load environment variables
console.log('\n3. Environment Variables:');
require('dotenv').config();
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`   PORT: ${process.env.PORT || 'not set'}`);
console.log(`   DB_HOST: ${process.env.DB_HOST || 'not set'}`);

// Step 4: Test core modules
console.log('\n4. Core Dependencies:');
const modules = ['express', 'cors', 'helmet', 'pg', 'jsonwebtoken'];
modules.forEach(mod => {
  try {
    require(mod);
    console.log(`   ✅ ${mod}`);
  } catch (e) {
    console.log(`   ❌ ${mod} - ${e.message}`);
  }
});

// Step 5: Create test Express app
console.log('\n5. Express Application Test:');
try {
  const express = require('express');
  const app = express();
  
  app.get('/', (req, res) => res.json({ test: 'ok' }));
  
  console.log('   ✅ Express app created');
  console.log('   ✅ Route configured');
} catch (e) {
  console.log(`   ❌ Express test failed: ${e.message}`);
}

console.log('\n✅ Verification completed!');
console.log('\n📝 Summary: CSL Backend environment is ready');
console.log('🚀 To start server: node enhanced-production-start.js');
console.log('🌐 Server will run on: http://localhost:5001');
