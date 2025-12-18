#!/usr/bin/env node

console.log('🔍 CSL Backend Server Status Check');
console.log('===================================\n');

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check 1: Verify we're in the right directory
console.log('1. Directory Check:');
const currentDir = process.cwd();
console.log(`   Current: ${currentDir}`);
console.log(`   Expected: Contains 'backend'`);

if (currentDir.includes('backend')) {
  console.log('   ✅ In backend directory');
} else {
  console.log('   ⚠️  Not in backend directory');
}

// Check 2: Verify package.json exists
const packagePath = path.join(currentDir, 'package.json');
if (fs.existsSync(packagePath)) {
  console.log('   ✅ package.json found');
  try {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    console.log(`   📦 Project: ${pkg.name} v${pkg.version}`);
  } catch (e) {
    console.log('   ⚠️  Could not parse package.json');
  }
} else {
  console.log('   ❌ package.json not found');
}

// Check 3: Verify node_modules
const nodeModulesPath = path.join(currentDir, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('   ✅ node_modules found');
} else {
  console.log('   ❌ node_modules not found - run npm install');
}

// Check 4: Check for running processes on port 5000
console.log('\n2. Port 5000 Status:');
exec('netstat -an', (error, stdout, stderr) => {
  if (error) {
    console.log('   ❌ Could not check ports');
    return;
  }
  
  if (stdout.includes(':5000')) {
    console.log('   ✅ Port 5000 is in use (server might be running)');
  } else {
    console.log('   ⚠️  Port 5000 is free (server not running)');
  }
});

// Check 5: Try to compile TypeScript
console.log('\n3. TypeScript Compilation:');
exec('npx tsc --noEmit', { cwd: currentDir }, (error, stdout, stderr) => {
  if (error) {
    console.log('   ❌ TypeScript compilation failed:');
    console.log(`   ${stderr}`);
  } else {
    console.log('   ✅ TypeScript compilation successful');
  }
  
  // Final recommendation
  setTimeout(() => {
    console.log('\n🚀 Next Steps:');
    console.log('   1. If not in backend directory: cd backend');
    console.log('   2. Install dependencies: npm install');
    console.log('   3. Start server: npm run dev');
    console.log('   4. Test: Open http://localhost:5000/health in browser');
    console.log('   5. Check console for startup messages');
  }, 2000);
});
