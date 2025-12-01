import { StudentRepository } from '../repositories/StudentRepository';
import { CourseRepository } from '../repositories/CourseRepository';
import { CertificateRepository } from '../repositories/CertificateRepository';
import { 
  IssueCertificateDTO, 
  CertificateVerificationResult,
  CertificateSearchFilter,
  PaginationOptions,
  CertificateStatus
} from '../types/models';
import { validateCertificateData } from '../utils/certificateUtils';
import { logger } from '../utils/logger';
import { PDFService } from './PDFService';

/**
 * Enhanced Certificate Service
 * Handles certificate business logic and orchestrates repository operations
 */
export class CertificateServiceV2 {
  private studentRepo: StudentRepository;
  private courseRepo: CourseRepository;
  private certificateRepo: CertificateRepository;

  constructor() {
    this.studentRepo = new StudentRepository();
    this.courseRepo = new CourseRepository();
    this.certificateRepo = new CertificateRepository();
  }

  /**
   * Issue a new certificate
   */
  async issueCertificate(data: IssueCertificateDTO, issuedBy: number) {
    // Validate input data
    const validation = validateCertificateData(data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check if student exists
    const student = await this.studentRepo.findById(data.student_id);
    if (!student) {
      throw new Error('Student not found');
    }

    // Check if course exists
    const course = await this.courseRepo.findById(data.course_id);
    if (!course) {
      throw new Error('Course not found');
    }

    // Check if certificate already exists for this student and course
    const existingCert = await this.certificateRepo.existsForStudentCourse(
      data.student_id, 
      data.course_id
    );
    if (existingCert) {
      throw new Error('Certificate already exists for this student and course');
    }

    // Issue the certificate (this creates the database record and generates CSL number)
    const certificate = await this.certificateRepo.issue(data, issuedBy);

    // Generate PDF for the certificate
    try {
      logger.info('Generating PDF for certificate', { csl_number: certificate.csl_number });

      // Get admin who issued the certificate for the PDF
      // For now, we'll use a placeholder - in production, fetch from admin repository
      const issuedByName = 'Director'; // TODO: Fetch actual admin name

      const pdfResult = await PDFService.generateCertificatePDF({
        student_name: `${student.first_name} ${student.last_name}`,
        course_name: course.course_name,
        course_code: course.course_code,
        serial_number: certificate.csl_number,
        issue_date: certificate.issue_date.toISOString(),
        duration: Math.round(course.duration_hours / 30) || 0, // Convert hours to months approximation
        issued_by: issuedByName
      });

      if (!pdfResult.success) {
        logger.error('PDF generation failed, but certificate was created', {
          csl_number: certificate.csl_number,
          error: pdfResult.error
        });
        // Note: We don't throw here - certificate is still valid even without PDF
        // The PDF can be regenerated later if needed
      } else {
        logger.info('PDF generated successfully', { 
          csl_number: certificate.csl_number,
          path: pdfResult.filePath 
        });
      }
    } catch (pdfError) {
      logger.error('Unexpected error during PDF generation', {
        csl_number: certificate.csl_number,
        error: pdfError
      });
      // Continue - certificate is still valid
    }

    logger.info('Certificate issued successfully', {
      csl_number: certificate.csl_number,
      student: `${student.first_name} ${student.last_name}`,
      course: course.course_name
    });

    return certificate;
  }

  /**
   * Verify certificate by CSL number
   */
  async verifyCertificate(cslNumber: string): Promise<CertificateVerificationResult> {
    return await this.certificateRepo.verify(cslNumber);
  }

  /**
   * Get certificate details with student and course info
   */
  async getCertificateDetails(id: number) {
    const certificate = await this.certificateRepo.findById(id);
    if (!certificate) {
      throw new Error('Certificate not found');
    }

    const student = await this.studentRepo.findById(certificate.student_id);
    const course = await this.courseRepo.findById(certificate.course_id);

    return {
      ...certificate,
      student: student ? {
        name: `${student.first_name} ${student.last_name}`,
        student_id: student.student_id,
        email: student.email
      } : null,
      course: course ? {
        name: course.course_name,
        code: course.course_code,
        category: course.category
      } : null
    };
  }

  /**
   * Search certificates
   */
  async searchCertificates(
    filters: CertificateSearchFilter = {},
    pagination: PaginationOptions = {}
  ) {
    return await this.certificateRepo.search(filters, pagination);
  }

  /**
   * Get certificates for a student
   */
  async getStudentCertificates(studentId: number) {
    const student = await this.studentRepo.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    return await this.certificateRepo.findByStudent(studentId);
  }

  /**
   * Get certificates for a course
   */
  async getCourseCertificates(courseId: number) {
    const course = await this.courseRepo.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    return await this.certificateRepo.findByCourse(courseId);
  }

  /**
   * Revoke certificate
   */
  async revokeCertificate(id: number, revokedBy: number) {
    const certificate = await this.certificateRepo.findById(id);
    if (!certificate) {
      throw new Error('Certificate not found');
    }

    if (certificate.status === CertificateStatus.REVOKED) {
      throw new Error('Certificate is already revoked');
    }

    const updatedCert = await this.certificateRepo.updateStatus(id, CertificateStatus.REVOKED, revokedBy);

    logger.info('Certificate revoked', {
      csl_number: certificate.csl_number,
      revoked_by: revokedBy
    });

    return updatedCert;
  }

  /**
   * Get certificate statistics
   */
  async getCertificateStatistics() {
    return await this.certificateRepo.getStatistics();
  }
}
