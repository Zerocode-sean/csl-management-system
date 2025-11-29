#!/usr/bin/env node

/**
 * Complete System Startup Script
 * Starts PostgreSQL, Backend, and verifies connectivity
 */

console.log('🚀 Starting CSL Management System');
console.log('================================\n');

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function testEndpoint(url, name) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      resolve({ success: true, status: res.statusCode });
    });
    
    req.on('error', (error) => {
      reject({ success: false, error: error.message });
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
      reject({ success: false, error: 'Timeout' });
    });
  });
}

async function startSystem() {
  try {
    // Step 1: Start PostgreSQL
    console.log('1️⃣ Starting PostgreSQL Docker Container...');
    
    const dockerStart = spawn('docker-compose', ['up', '-d', 'postgres'], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'pipe'
    });
    
    await new Promise((resolve, reject) => {
      dockerStart.on('close', (code) => {
        if (code === 0) {
          console.log('✅ PostgreSQL container started');
          resolve();
        } else {
          reject(new Error(`Docker failed with code ${code}`));
        }
      });
    });
    
    // Wait for PostgreSQL to be ready
    console.log('⏳ Waiting for PostgreSQL to be ready...');
    await sleep(5000);
    
    // Step 2: Start Backend Server
    console.log('\n2️⃣ Starting Backend Server...');
    
    const backend = spawn('node', ['database-production-server.js'], {
      cwd: __dirname,
      detached: true,
      stdio: 'ignore'
    });
    
    backend.unref();
    console.log('✅ Backend server started (PID:', backend.pid, ')');
    
    // Step 3: Wait and test connectivity
    console.log('\n3️⃣ Testing System Connectivity...');
    await sleep(3000);
    
    // Test health endpoint
    try {
      const health = await testEndpoint('http://localhost:5001/health', 'Health Check');
      console.log('✅ Backend Health:', health.status);
    } catch (error) {
      console.log('❌ Backend Health:', error.error);
      throw new Error('Backend not responding');
    }
    
    // Test students API
    try {
      const students = await testEndpoint('http://localhost:5001/api/v1/students', 'Students API');
      console.log('✅ Students API:', students.status);
    } catch (error) {
      console.log('❌ Students API:', error.error);
      throw new Error('Students API not responding');
    }
    
    console.log('\n🎉 System Startup Complete!');
    console.log('===========================');
    console.log('✅ PostgreSQL: Running in Docker');
    console.log('✅ Backend API: http://localhost:5001');
    console.log('✅ Students Module: Ready for frontend');
    console.log('\n💡 You can now:');
    console.log('   1. Start frontend: cd ../frontend && npm run dev');
    console.log('   2. Test API: curl http://localhost:5001/api/v1/students');
    console.log('   3. Open test page: students-test.html');
    
  } catch (error) {
    console.error('❌ Startup failed:', error.message);
    console.log('\n🛠️ Troubleshooting:');
    console.log('   1. Check Docker is running: docker --version');
    console.log('   2. Check ports: netstat -an | findstr 5001');
    console.log('   3. Manual start: node database-production-server.js');
    process.exit(1);
  }
}

startSystem();
