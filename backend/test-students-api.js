#!/usr/bin/env node

/**
 * Test Students API Response
 */

console.log('🔍 Testing Students API Response\n');

const http = require('http');

function makeRequest(endpoint, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testStudentsAPI() {
  try {
    console.log('Testing /api/v1/students endpoint...\n');
    
    const result = await makeRequest('/api/v1/students');
    
    console.log(`Status: ${result.status}`);
    console.log('Response:');
    console.log(JSON.stringify(result.data, null, 2));
    
    if (result.data && result.data.data && result.data.data.length > 0) {
      console.log('\n📊 Student Data Structure:');
      console.log('==========================');
      const student = result.data.data[0];
      Object.keys(student).forEach(key => {
        console.log(`   ${key}: ${typeof student[key]} (${student[key]})`);
      });
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    console.log('Make sure the backend server is running on port 5001');
  }
}

testStudentsAPI();
