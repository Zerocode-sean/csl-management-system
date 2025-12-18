import { CertificateService } from '../../src/services/certificateService';
import { TestDatabase } from '../setup/testDatabase';
import { mockCourses, mockStudents, generateRandomStudent } from '../setup/mockData';
import { ensureTestCertificatesDir, cleanTestCertificates, isPDFValid } from '../utils/testHelpers';

/**
 * Integration Tests for Certificate Generation
 * Tests the full certificate workflow with database
 */
describe('Certificate Integration Tests', () => {
  let testCourse: any;
  let testStudent: any;
  let testUser: any;

  beforeAll(async () => {
    // Ensure certificates directory exists
    ensureTestCertificatesDir();
    
    // Fetch existing test course (created by globalSetup)
    const courseResult = await TestDatabase.query(
      'SELECT * FROM courses WHERE course_code = $1',
      ['WD101']
    );
    testCourse = courseResult.rows[0];
    
    testUser = await TestDatabase.createTestUser({
      username: 'integrationadmin',
      email: 'integration@test.com',
      role: 'admin',
    });
  });

  beforeEach(async () => {
    // Clean certificates table before each test
    await TestDatabase.cleanTables(['certificates']);
    
    // Create fresh student for each test
    const studentData = generateRandomStudent();
    testStudent = await TestDatabase.createTestStudent({
      ...studentData,
      courseId: testCourse.course_id,
    });
  });

  afterAll(async () => {
    // Clean up test certificates
    cleanTestCertificates();
    await TestDatabase.close();
  });

  describe('Certificate Generation', () => {
    it('should generate a certificate with valid CSL number', async () => {
      const certificateData = {
        student_id: testStudent.student_id.toString(),
        course_id: testCourse.course_id.toString(),
        issued_by: testUser.user_id.toString(),
      };

      const result = await CertificateService.issueCertificate(certificateData);

      expect(result).toBeDefined();
      expect(result.cslNumber).toBeDefined();
      expect(result.cslNumber).toMatch(/^\d{4}-[A-Z]{2,3}-\d{4}-[A-Z0-9]{6}$/);
      
      // Verify database entry
      const dbResult = await TestDatabase.query(
        'SELECT * FROM certificates WHERE csl_number = $1',
        [result.cslNumber]
      );
      
      expect(dbResult.rows).toHaveLength(1);
      expect(dbResult.rows[0].student_id).toBe(testStudent.student_id);
      expect(dbResult.rows[0].course_id).toBe(testCourse.course_id);
      expect(dbResult.rows[0].status).toBe('active');
    });

    it('should generate unique CSL numbers for different certificates', async () => {
      const student1 = await TestDatabase.createTestStudent({
        ...generateRandomStudent(),
        courseId: testCourse.course_id,
      });
      
      const student2 = await TestDatabase.createTestStudent({
        ...generateRandomStudent(),
        courseId: testCourse.course_id,
      });

      const cert1 = await CertificateService.issueCertificate({
        student_id: student1.student_id.toString(),
        course_id: testCourse.course_id.toString(),
        issued_by: testUser.user_id.toString(),
      });

      const cert2 = await CertificateService.issueCertificate({
        student_id: student2.student_id.toString(),
        course_id: testCourse.course_id.toString(),
        issued_by: testUser.user_id.toString(),
      });

      expect(cert1.cslNumber).not.toBe(cert2.cslNumber);
    });

    it('should handle concurrent certificate generation', async () => {
      const students = await Promise.all(
        Array.from({ length: 5 }, () =>
          TestDatabase.createTestStudent({
            ...generateRandomStudent(),
            courseId: testCourse.course_id,
          })
        )
      );

      const promises = students.map((student) =>
        CertificateService.issueCertificate({
          student_id: student.student_id.toString(),
          course_id: testCourse.course_id.toString(),
          issued_by: testUser.user_id.toString(),
        })
      );

      const results = await Promise.all(promises);

      // All should succeed
      expect(results).toHaveLength(5);
      
      // All CSL numbers should be unique
      const cslNumbers = results.map((r) => r.cslNumber);
      const uniqueCSLs = new Set(cslNumbers);
      expect(uniqueCSLs.size).toBe(5);
    });

    it('should increment sequential numbers correctly', async () => {
      const cert1 = await CertificateService.issueCertificate({
        student_id: testStudent.student_id.toString(),
        course_id: testCourse.course_id.toString(),
        issued_by: testUser.user_id.toString(),
      });

      const student2 = await TestDatabase.createTestStudent({
        ...generateRandomStudent(),
        courseId: testCourse.course_id,
      });

      const cert2 = await CertificateService.issueCertificate({
        student_id: student2.student_id.toString(),
        course_id: testCourse.course_id.toString(),
        issued_by: testUser.user_id.toString(),
      });

      const parsed1 = CertificateService.parseCSL(cert1.cslNumber);
      const parsed2 = CertificateService.parseCSL(cert2.cslNumber);

      expect(parsed1).not.toBeNull();
      expect(parsed2).not.toBeNull();
      
      const seq1 = parseInt(parsed1!.sequential);
      const seq2 = parseInt(parsed2!.sequential);
      
      expect(seq2).toBeGreaterThan(seq1);
    });
  });

  describe('Certificate Verification', () => {
    let testCertificate: any;

    beforeEach(async () => {
      testCertificate = await CertificateService.issueCertificate({
        student_id: testStudent.student_id.toString(),
        course_id: testCourse.course_id.toString(),
        issued_by: testUser.user_id.toString(),
      });
    });

    it('should verify valid certificate', async () => {
      const result = await CertificateService.verifyCertificate(testCertificate.cslNumber);

      expect(result.valid).toBe(true);
      expect(result.certificate).toBeDefined();
      expect(result.certificate.csl_number).toBe(testCertificate.cslNumber);
    });

    it('should reject invalid CSL number', async () => {
      const result = await CertificateService.verifyCertificate('INVALID-CSL');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('Invalid');
    });

    it('should reject non-existent certificate', async () => {
      const result = await CertificateService.verifyCertificate('2024-WD-9999-ABC123');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should detect revoked certificates', async () => {
      // Revoke the certificate
      await CertificateService.revokeCertificate(
        testCertificate.certificateId,
        testUser.user_id.toString(),
        'Test revocation'
      );

      const result = await CertificateService.verifyCertificate(testCertificate.cslNumber);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('revoked');
    });
  });

  describe('Certificate Revocation', () => {
    let testCertificate: any;

    beforeEach(async () => {
      testCertificate = await CertificateService.issueCertificate({
        student_id: testStudent.student_id.toString(),
        course_id: testCourse.course_id.toString(),
        issued_by: testUser.user_id.toString(),
      });
    });

    it('should revoke certificate successfully', async () => {
      const result = await CertificateService.revokeCertificate(
        testCertificate.certificateId,
        testUser.user_id.toString(),
        'Violation of terms'
      );

      expect(result).toBeDefined();
      expect(result.status).toBe('revoked');
      expect(result.revoked_by).toBe(testUser.user_id);
      expect(result.revocation_reason).toBe('Violation of terms');
      expect(result.revoked_at).toBeDefined();
    });

    it('should update status in database', async () => {
      await CertificateService.revokeCertificate(
        testCertificate.certificateId,
        testUser.user_id.toString(),
        'Test reason'
      );

      const dbResult = await TestDatabase.query(
        'SELECT * FROM certificates WHERE certificate_id = $1',
        [testCertificate.certificateId]
      );

      expect(dbResult.rows[0].status).toBe('revoked');
      expect(dbResult.rows[0].revoked_by).toBe(testUser.user_id);
    });
  });

  describe('Certificate Listing and Filtering', () => {
    beforeEach(async () => {
      // Create multiple certificates
      const students = await Promise.all([
        TestDatabase.createTestStudent({ ...generateRandomStudent(), courseId: testCourse.course_id }),
        TestDatabase.createTestStudent({ ...generateRandomStudent(), courseId: testCourse.course_id }),
        TestDatabase.createTestStudent({ ...generateRandomStudent(), courseId: testCourse.course_id }),
      ]);

      for (const student of students) {
        await CertificateService.issueCertificate({
          student_id: student.student_id.toString(),
          course_id: testCourse.course_id.toString(),
          issued_by: testUser.user_id.toString(),
        });
      }
    });

    it('should retrieve certificates with pagination', async () => {
      const result = await CertificateService.getCertificates({
        page: 1,
        limit: 2,
      });

      expect(result.certificates).toHaveLength(2);
      expect(result.total).toBeGreaterThanOrEqual(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
    });

    it('should filter by student ID', async () => {
      const result = await CertificateService.getCertificates({
        studentId: testStudent.student_id.toString(),
      });

      expect(result.certificates.length).toBeGreaterThan(0);
      result.certificates.forEach((cert: any) => {
        expect(cert.student_id).toBe(testStudent.student_id);
      });
    });

    it('should filter by course ID', async () => {
      const result = await CertificateService.getCertificates({
        courseId: testCourse.course_id.toString(),
      });

      expect(result.certificates.length).toBeGreaterThan(0);
      result.certificates.forEach((cert: any) => {
        expect(cert.course_id).toBe(testCourse.course_id);
      });
    });

    it('should filter by status', async () => {
      const result = await CertificateService.getCertificates({
        status: 'active',
      });

      result.certificates.forEach((cert: any) => {
        expect(cert.status).toBe('active');
      });
    });
  });
});
