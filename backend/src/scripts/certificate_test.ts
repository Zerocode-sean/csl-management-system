import dotenv from 'dotenv';
import path from 'path';
import { connectDatabase, closeDatabase, query } from '../database/connection';
import { CertificateGeneratorService } from '../services/certificateGenerator.service';
import { logger } from '../utils/logger';

// Load environment variables from backend root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const runTest = async () => {
  try {
    console.log('Starting Certificate Generation Test...');
    
    // Connect to database
    await connectDatabase();

    // 1. Get or create a test admin
    let adminId: number;
    const adminResult = await query("SELECT admin_id FROM admins LIMIT 1");
    if (adminResult.rows.length > 0) {
      adminId = adminResult.rows[0].admin_id;
      console.log(`Using existing admin ID: ${adminId}`);
    } else {
      // Create dummy admin if none exists (simplified for test)
      const newAdmin = await query(`
        INSERT INTO admins (name, email, password, role) 
        VALUES ('Test Admin', 'testadmin@example.com', 'hashedpassword', 'super_admin') 
        RETURNING admin_id
      `);
      adminId = newAdmin.rows[0].admin_id;
      console.log(`Created test admin ID: ${adminId}`);
    }

    // 2. Get or create a test student
    let studentId: number;
    const studentResult = await query("SELECT student_id FROM students LIMIT 1");
    if (studentResult.rows.length > 0) {
      studentId = studentResult.rows[0].student_id;
      console.log(`Using existing student ID: ${studentId}`);
    } else {
      const newStudent = await query(`
        INSERT INTO students (name, email, phone, admission_number) 
        VALUES ('Test Student', 'teststudent@example.com', '1234567890', 'ADM001') 
        RETURNING student_id
      `);
      studentId = newStudent.rows[0].student_id;
      console.log(`Created test student ID: ${studentId}`);
    }

    // 3. Get or create a test course
    let courseId: number;
    const courseResult = await query("SELECT course_id FROM courses LIMIT 1");
    if (courseResult.rows.length > 0) {
      courseId = courseResult.rows[0].course_id;
      console.log(`Using existing course ID: ${courseId}`);
    } else {
      const newCourse = await query(`
        INSERT INTO courses (title, code, description, duration_hours) 
        VALUES ('Test Course', 'TC', 'Description', 100) 
        RETURNING course_id
      `);
      courseId = newCourse.rows[0].course_id;
      console.log(`Created test course ID: ${courseId}`);
    }

    // 4. Check if certificate already exists and delete it to allow re-testing
    await query(
      "DELETE FROM certificates WHERE student_id = $1 AND course_id = $2",
      [studentId, courseId]
    );
    console.log('Cleaned up any existing certificates for this student/course');

    // 5. Generate Certificate
    console.log('Generating certificate...');
    const result = await CertificateGeneratorService.generateCertificate(
      studentId,
      courseId,
      adminId
    );

    console.log('Certificate generated successfully!');
    console.log('CSL Number:', result.cslNumber);
    console.log('PDF Path:', result.pdfPath);

    // 6. Verify in database
    const certCheck = await query(
      "SELECT * FROM certificates WHERE csl_number = $1",
      [result.cslNumber]
    );

    if (certCheck.rows.length > 0) {
      console.log('Verification: Certificate found in database.');
    } else {
      console.error('Verification FAILED: Certificate NOT found in database.');
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await closeDatabase();
    process.exit(0);
  }
};

runTest();
