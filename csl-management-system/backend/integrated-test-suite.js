#!/usr/bin/env node

/**
 * Integrated Test Suite - Starts server and runs all tests
 */

console.log('🧪 CSL Backend Integrated Test Suite');
console.log('====================================\n');

const { spawn, exec } = require('child_process');
const http = require('http');
const path = require('path');

// Helper function to check if server is running
function checkServer(port = 5001) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/health`, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
    
    setTimeout(() => {
      req.destroy();
      resolve(false);
    }, 3000);
  });
}

// Helper function to wait for server to be ready
async function waitForServer(maxAttempts = 15) {
  console.log('⏳ Waiting for server to be ready...');
  
  for (let i = 1; i <= maxAttempts; i++) {
    const isReady = await checkServer();
    if (isReady) {
      console.log(`✅ Server is ready! (attempt ${i})`);
      return true;
    }
    console.log(`   Attempt ${i}/${maxAttempts}: Server not ready yet...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('❌ Server failed to start after maximum attempts');
  return false;
}

// Function to run a test file
function runTest(testFile) {
  return new Promise((resolve) => {
    console.log(`\n🔬 Running ${testFile}...`);
    console.log('─'.repeat(50));
    
    const testProcess = spawn('node', [testFile], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${testFile} completed successfully`);
      } else {
        console.log(`❌ ${testFile} failed with exit code ${code}`);
      }
      resolve(code === 0);
    });
    
    testProcess.on('error', (error) => {
      console.log(`❌ Error running ${testFile}:`, error.message);
      resolve(false);
    });
  });
}

async function main() {
  let serverProcess;
  
  try {
    // Check if server is already running
    const isAlreadyRunning = await checkServer();
    
    if (isAlreadyRunning) {
      console.log('✅ Server is already running on port 5001');
    } else {
      console.log('🚀 Starting enhanced production server...');
      
      // Start the server
      serverProcess = spawn('node', ['enhanced-production-start.js'], {
        stdio: 'pipe',
        cwd: process.cwd()
      });
      
      // Log server output
      serverProcess.stdout.on('data', (data) => {
        console.log(`[SERVER] ${data.toString().trim()}`);
      });
      
      serverProcess.stderr.on('data', (data) => {
        console.error(`[SERVER ERROR] ${data.toString().trim()}`);
      });
      
      // Wait for server to be ready
      const serverReady = await waitForServer();
      
      if (!serverReady) {
        console.log('❌ Failed to start server, cannot run tests');
        if (serverProcess) {
          serverProcess.kill('SIGTERM');
        }
        process.exit(1);
      }
    }
    
    console.log('\n🎯 Server is ready! Starting test execution...\n');
    
    // List of test files to run
    const testFiles = [
      'connection-test.js',
      'comprehensive-test.js', 
      'enhanced-test-suite.js'
    ];
    
    const results = [];
    
    // Run each test
    for (const testFile of testFiles) {
      const success = await runTest(testFile);
      results.push({ test: testFile, success });
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    
    let passCount = 0;
    let failCount = 0;
    
    results.forEach(({ test, success }) => {
      const status = success ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${test}`);
      if (success) passCount++;
      else failCount++;
    });
    
    console.log('─'.repeat(50));
    console.log(`Total Tests: ${results.length}`);
    console.log(`Passed: ${passCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`Success Rate: ${Math.round((passCount / results.length) * 100)}%`);
    
    if (failCount === 0) {
      console.log('\n🎉 All tests passed! The CSL Backend is working perfectly!');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the output above.');
    }
    
    console.log('\n🌐 Server Info:');
    console.log(`   Health Check: http://localhost:5001/health`);
    console.log(`   API Documentation: http://localhost:5001/api-docs`);
    console.log(`   Base URL: http://localhost:5001/api`);
    
    if (!isAlreadyRunning && serverProcess) {
      console.log('\n⏹️  Stopping server...');
      serverProcess.kill('SIGTERM');
      
      // Wait a bit for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
  } catch (error) {
    console.error('❌ Error during test execution:', error);
    
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
    
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test suite interrupted');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Test suite terminated');
  process.exit(0);
});

// Run the test suite
main().catch(console.error);
