
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1';

const verifyStudents = async () => {
  try {
    console.log('Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@csl.com',
      password: 'Admin@2025'
    });

    if (!loginResponse.data.success) {
      console.error('Login failed:', loginResponse.data);
      return;
    }

    const token = loginResponse.data.data.accessToken;
    console.log('Login successful. Token obtained.');

    console.log('Fetching students...');
    const studentsResponse = await axios.get(`${API_URL}/students`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (studentsResponse.data.success) {
      console.log('Successfully fetched students!');
      console.log(`Count: ${studentsResponse.data.data.students.length}`);
    } else {
      console.error('Failed to fetch students:', studentsResponse.data);
    }

  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
};

verifyStudents();
