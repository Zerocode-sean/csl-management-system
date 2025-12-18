
const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 5000;
const API_PREFIX = '/api/v1';
const ADMIN_EMAIL = 'admin@csl.com';
const ADMIN_PASSWORD = 'Admin@2025';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: API_PREFIX + path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const data = Buffer.concat(chunks);
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          json: () => {
            try {
              return JSON.parse(data.toString());
            } catch (e) {
              return null;
            }
          },
          text: () => data.toString()
        });
      });
    });

    req.on('error', (e) => reject(e));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testCertificates() {
  try {
    console.log('1. Authenticating...');
    const loginRes = await request('POST', '/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

    if (loginRes.status !== 200) {
      throw new Error(`Login failed: ${loginRes.status} ${loginRes.text()}`);
    }

    const loginData = loginRes.json();
    const token = loginData.token;
    console.log('   Authentication successful. Token obtained.');

    console.log('\n2. Fetching a student and a course...');
    // Get students
    const studentsRes = await request('GET', '/students?limit=1', null, token);
    const studentsData = studentsRes.json();
    const student = studentsData.data.students[0];
    
    // Get courses
    const coursesRes = await request('GET', '/courses?limit=1', null, token);
    const coursesData = coursesRes.json();
    const course = coursesData.data.courses[0];

    if (!student || !course) {
      throw new Error('No students or courses found to test with.');
    }

    console.log(`   Selected Student: ${student.name} (ID: ${student.student_id})`);
    console.log(`   Selected Course: ${course.title} (ID: ${course.course_id})`);

    console.log('\n3. Generating Certificate...');
    const generateRes = await request('POST', '/certificates/generate', {
      student_id: student.student_id,
      course_id: course.course_id
    }, token);

    let cslNumber;

    if (generateRes.status === 409) {
      console.log('   Certificate already exists. Fetching existing certificates for this student...');
      
       // Let's just list certificates and pick the first one if generation failed.
       const listRes = await request('GET', '/certificates?limit=1', null, token);
       const listData = listRes.json();
       if (listData.data.certificates.length > 0) {
         cslNumber = listData.data.certificates[0].csl_number;
         console.log(`   Using existing certificate: ${cslNumber}`);
       } else {
         throw new Error('Certificate generation failed (409) and no certificates found to test download.');
       }

    } else if (generateRes.status !== 201) {
      const err = generateRes.text();
      throw new Error(`Generation failed: ${generateRes.status} ${err}`);
    } else {
      const generateData = generateRes.json();
      cslNumber = generateData.data.csl_number;
      console.log(`   Certificate generated successfully! CSL Number: ${cslNumber}`);
    }

    console.log('\n4. Downloading Certificate PDF...');
    const downloadRes = await request('GET', `/certificates/${cslNumber}/download`, null, token);

    if (downloadRes.status !== 200) {
       const err = downloadRes.text();
       throw new Error(`Download failed: ${downloadRes.status} ${err}`);
    }

    console.log(`   Download successful! PDF size: ${downloadRes.body.length} bytes`);
    
    console.log('\n✅ Backend Certificate Module Test PASSED');

  } catch (error) {
    console.error('\n❌ Test FAILED:', error.message);
    process.exit(1);
  }
}

testCertificates();