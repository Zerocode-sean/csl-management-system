const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

async function generateCertificate() {
  try {
    // 1. Login
    console.log('Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@csl.com',
      password: 'Admin@2025'
    });
    
    const token = loginResponse.data.data.token;
    console.log('Login successful!');
    
    // 2. Generate certificate
    console.log('\nGenerating certificate...');
    const certResponse = await axios.post(
      `${BASE_URL}/certificates/generate`,
      {
        student_id: 38,
        course_id: 2
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    );
    
    console.log('\n✅ Certificate generated successfully!');
    console.log(JSON.stringify(certResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

generateCertificate();
