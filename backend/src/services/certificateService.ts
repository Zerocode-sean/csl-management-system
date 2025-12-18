import * as crypto from 'crypto';
import { query } from '../database/connection';
import { config } from '../config';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import * as puppeteer from 'puppeteer';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

export interface CertificateData {
  student_id: string;
  course_id: string;
  issued_by: string;
}

export interface CSLComponents {
  year: string;
  courseCode: string;
  sequential: string;
  hash: string;
  fullCSL: string;
}

export class CertificateService {
  
  /**
   * Generate CSL number in format: YYYY-CC-NNNN-VVVVVV
   */
  static async generateCSL(certificateData: CertificateData): Promise<CSLComponents> {
    try {
      // Get current year
      const year = new Date().getFullYear().toString();

      // Get course code
      const courseResult = await query(
        'SELECT code FROM courses WHERE course_id = $1',
        [certificateData.course_id]
      );

      if (courseResult.rows.length === 0) {
        throw createError('Course not found', 404);
      }

      const courseCode = courseResult.rows[0].code.toUpperCase();

      // Get next sequential number
      const sequential = await this.getNextSequentialNumber(year, courseCode);

      // Create base CSL without hash
      const baseCSL = `${year}-${courseCode}-${sequential}`;

      // Generate verification hash
      const hash = this.generateVerificationHash(certificateData.student_id, baseCSL);

      // Create full CSL
      const fullCSL = `${baseCSL}-${hash}`;

      return {
        year,
        courseCode,
        sequential,
        hash,
        fullCSL
      };

    } catch (error) {
      logger.error('Failed to generate CSL:', error);
      throw error;
    }
  }

  /**
   * Get next sequential number for the year and course
   */
  private static async getNextSequentialNumber(year: string, courseCode: string): Promise<string> {
    try {
      const result = await query(
        'SELECT get_next_sequential_number($1, $2) as next_number',
        [parseInt(year), courseCode]
      );

      const nextNumber = result.rows[0].next_number;
      return nextNumber.toString().padStart(4, '0');

    } catch (error) {
      logger.error('Failed to get next sequential number:', error);
      throw createError('Failed to generate certificate number', 500);
    }
  }

  /**
   * Generate cryptographic verification hash
   */
  private static generateVerificationHash(studentId: string, baseCSL: string): string {
    const data = studentId + baseCSL + config.csl.pepperKey;
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return hash.substring(0, config.csl.hashLength).toUpperCase();
  }

  /**
   * Validate CSL format
   */
  static validateCSLFormat(cslNumber: string): boolean {
    const cslRegex = /^\d{4}-[A-Z]{2,3}-\d{4}-[A-Z0-9]{6}$/;
    return cslRegex.test(cslNumber);
  }

  /**
   * Parse CSL components
   */
  static parseCSL(cslNumber: string): CSLComponents | null {
    if (!this.validateCSLFormat(cslNumber)) {
      return null;
    }

    const parts = cslNumber.split('-');
    return {
      year: parts[0] ?? '',
      courseCode: parts[1] ?? '',
      sequential: parts[2] ?? '',
      hash: parts[3] ?? '',
      fullCSL: cslNumber
    };
  }

  /**
   * Generate QR Code for certificate verification
   */
  static async generateQRCode(cslNumber: string): Promise<string> {
    try {
      const verificationUrl = `${process.env['FRONTEND_URL'] || 'http://localhost:3000'}/verify/${cslNumber}`;
      const qrCodeDataURL = await QRCode.toDataURL(verificationUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataURL;
    } catch (error) {
      logger.error('Failed to generate QR code:', error);
      throw createError('QR code generation failed', 500);
    }
  }

  /**
   * Generate PDF certificate
   */
  static async generatePDF(certificateDetails: any): Promise<string> {
    let browser;
    try {
      // Ensure uploads directory exists
      const uploadsDir = path.join(process.cwd(), 'uploads', 'certificates');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate QR code
      const qrCode = await this.generateQRCode(certificateDetails.cslNumber);

      // Read template
      const templatePath = path.join(process.cwd(), 'src', 'templates', 'certificate.html');
      let template = fs.readFileSync(templatePath, 'utf-8');

      // Replace placeholders
      template = template
        .replace(/{{CSL_NUMBER}}/g, certificateDetails.cslNumber)
        .replace(/{{STUDENT_NAME}}/g, certificateDetails.studentName)
        .replace(/{{STUDENT_ID}}/g, certificateDetails.studentId || 'N/A')
        .replace(/{{COURSE_NAME}}/g, certificateDetails.courseName)
        .replace(/{{COURSE_CODE}}/g, certificateDetails.courseCode)
        .replace(/{{ISSUE_DATE}}/g, new Date(certificateDetails.issueDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }))
        .replace(/{{COMPLETION_DATE}}/g, certificateDetails.completionDate ? new Date(certificateDetails.completionDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : 'N/A')
        .replace(/{{ISSUED_BY}}/g, certificateDetails.issuedBy || 'CSL Administration')
        .replace(/{{QR_CODE}}/g, qrCode);

      // Launch puppeteer
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setContent(template, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdfFileName = `${certificateDetails.cslNumber}.pdf`;
      const pdfPath = path.join(uploadsDir, pdfFileName);

      await page.pdf({
        path: pdfPath,
        format: 'A4',
        landscape: true,
        printBackground: true,
        preferCSSPageSize: true
      });

      await browser.close();

      logger.info('PDF generated successfully:', { cslNumber: certificateDetails.cslNumber, path: pdfPath });

      return pdfPath;

    } catch (error) {
      if (browser) {
        await browser.close();
      }
      logger.error('Failed to generate PDF:', error);
      throw createError('PDF generation failed', 500);
    }
  }

  /**
   * Get certificate file path
   */
  static getCertificatePath(cslNumber: string): string {
    // Match the path used by CertificateGeneratorService
    return path.join(__dirname, '../../certificates', `${cslNumber}.pdf`);
  }

  /**
   * Verify certificate authenticity
   */
  static async verifyCertificate(cslNumber: string): Promise<{
    valid: boolean;
    certificate?: any;
    message: string;
  }> {
    try {
      // Validate format
      if (!this.validateCSLFormat(cslNumber)) {
        return {
          valid: false,
          message: 'Invalid CSL number format'
        };
      }

      // Get certificate from database
      const result = await query(`
        SELECT 
          c.*,
          s.name as student_name,
          s.email as student_email,
          course.title as course_title,
          course.code as course_code,
          admin.first_name || ' ' || admin.last_name as issuer_name
        FROM certificates c
        JOIN students s ON c.student_id = s.student_id
        JOIN courses course ON c.course_id = course.course_id
        JOIN admins admin ON c.issued_by_admin_id = admin.admin_id
        WHERE c.csl_number = $1
      `, [cslNumber]);

      if (result.rows.length === 0) {
        return {
          valid: false,
          message: 'Certificate not found'
        };
      }

      const certificate = result.rows[0];

      // Check if certificate is active
      if (certificate.status !== 'active') {
        return {
          valid: false,
          certificate,
          message: `Certificate is ${certificate.status}`
        };
      }

      // Verify cryptographic hash
      const components = this.parseCSL(cslNumber);
      if (!components) {
        return {
          valid: false,
          message: 'Invalid CSL format'
        };
      }

      const baseCSL = `${components.year}-${components.courseCode}-${components.sequential}`;
      const expectedHash = this.generateVerificationHash(certificate.student_id, baseCSL);

      if (expectedHash !== components.hash) {
        logger.warn('Certificate hash verification failed:', {
          cslNumber,
          expectedHash,
          actualHash: components.hash,
          studentId: certificate.student_id
        });

        return {
          valid: false,
          certificate,
          message: 'Certificate authenticity could not be verified'
        };
      }

      return {
        valid: true,
        certificate,
        message: 'Certificate is valid and authentic'
      };

    } catch (error) {
      logger.error('Certificate verification failed:', error);
      throw createError('Verification service error', 500);
    }
  }

  /**
   * Issue a new certificate
   */
  static async issueCertificate(certificateData: CertificateData): Promise<any> {
    try {
      // Check if certificate already exists for this student and course
      const existingResult = await query(
        'SELECT certificate_id FROM certificates WHERE student_id = $1 AND course_id = $2 AND status = $3',
        [certificateData.student_id, certificateData.course_id, 'active']
      );

      if (existingResult.rows.length > 0) {
        throw createError('Certificate already exists for this student and course', 409);
      }

      // Generate CSL
      const cslComponents = await this.generateCSL(certificateData);

      // Get student and course details for PDF
      const detailsResult = await query(`
        SELECT 
          s.first_name || ' ' || s.last_name as student_name,
          s.student_custom_id,
          c.title as course_name,
          c.code as course_code,
          u.username as issued_by_name
        FROM students s
        CROSS JOIN courses c
        CROSS JOIN users u
        WHERE s.student_id = $1 
          AND c.course_id = $2
          AND u.user_id = $3
      `, [certificateData.student_id, certificateData.course_id, certificateData.issued_by]);

      if (detailsResult.rows.length === 0) {
        throw createError('Student, course, or issuer not found', 404);
      }

      const details = detailsResult.rows[0];

      // Insert certificate
      const result = await query(`
        INSERT INTO certificates (
          student_id, course_id, issued_by, csl_number, status, issued_at
        ) VALUES ($1, $2, $3, $4, 'active', NOW())
        RETURNING *
      `, [
        certificateData.student_id,
        certificateData.course_id,
        certificateData.issued_by,
        cslComponents.fullCSL
      ]);

      const certificate = result.rows[0];

      // Generate PDF
      const certificateDetails = {
        cslNumber: certificate.csl_number,
        studentName: details.student_name,
        studentId: details.student_custom_id,
        courseName: details.course_name,
        courseCode: details.course_code,
        issueDate: certificate.issued_at,
        completionDate: certificate.completion_date,
        issuedBy: details.issued_by_name
      };

      const pdfPath = await this.generatePDF(certificateDetails);

      // Update certificate with PDF path
      await query(`
        UPDATE certificates 
        SET pdf_path = $1
        WHERE csl_number = $2
      `, [pdfPath, certificate.csl_number]);

      logger.info('Certificate issued successfully with PDF:', {
        certificateId: certificate.certificate_id,
        cslNumber: certificate.csl_number,
        studentId: certificate.student_id,
        issuedBy: certificate.issued_by,
        pdfPath
      });

      return {
        ...certificate,
        pdf_path: pdfPath,
        cslNumber: certificate.csl_number
      };

    } catch (error) {
      logger.error('Failed to issue certificate:', error);
      throw error;
    }
  }

  /**
   * Revoke a certificate
   */
  static async revokeCertificate(
    cslNumber: string,
    revokedBy: string,
    reason?: string
  ): Promise<any> {
    try {
      const result = await query(`
        UPDATE certificates 
        SET 
          status = 'revoked',
          revoked_by_admin_id = $2,
          revoked_at = NOW(),
          revocation_reason = $3,
          updated_at = NOW()
        WHERE csl_number = $1 AND status = 'active'
        RETURNING *
      `, [cslNumber, revokedBy, reason || 'No reason provided']);

      if (result.rows.length === 0) {
        throw createError('Certificate not found or already revoked', 404);
      }

      const certificate = result.rows[0];

      logger.info('Certificate revoked successfully:', {
        cslNumber: certificate.csl_number,
        revokedBy,
        reason
      });

      return certificate;

    } catch (error) {
      logger.error('Failed to revoke certificate:', error);
      throw error;
    }
  }

  /**
   * Get certificates with filters and pagination
   */
  static async getCertificates(params: {
    page?: number;
    limit?: number;
    status?: string;
    courseId?: string;
    studentId?: string;
    search?: string;
  }): Promise<{ certificates: any[]; total: number; page: number; limit: number }> {
    try {
      const page = params.page || 1;
      const limit = params.limit || 10;
      const offset = (page - 1) * limit;

      let whereConditions: string[] = [];
      let queryParams: any[] = [];
      let paramIndex = 1;

      // Build WHERE conditions
      if (params.status) {
        whereConditions.push(`c.status = $${paramIndex++}`);
        queryParams.push(params.status);
      }

      if (params.courseId) {
        whereConditions.push(`c.course_id = $${paramIndex++}`);
        queryParams.push(params.courseId);
      }

      if (params.studentId) {
        whereConditions.push(`c.student_id = $${paramIndex++}`);
        queryParams.push(params.studentId);
      }

      if (params.search) {
        whereConditions.push(`(
          s.name ILIKE $${paramIndex} OR 
          s.email ILIKE $${paramIndex} OR 
          c.csl_number ILIKE $${paramIndex} OR
          course.title ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${params.search}%`);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Get certificates
      const certificatesQuery = `
        SELECT 
          c.*,
          s.name as student_name,
          s.email as student_email,
          s.mobile as student_phone,
          s.current_grade as grade,
          course.title as course_title,
          course.code as course_code,
          issuer.first_name || ' ' || issuer.last_name as issuer_name,
          revoker.first_name || ' ' || revoker.last_name as revoker_name
        FROM certificates c
        JOIN students s ON c.student_id = s.student_id
        JOIN courses course ON c.course_id = course.course_id
        JOIN admins issuer ON c.issued_by_admin_id = issuer.admin_id
        LEFT JOIN admins revoker ON c.revoked_by_admin_id = revoker.admin_id
        ${whereClause}
        ORDER BY c.issue_date DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `;

      queryParams.push(limit, offset);

      const certificatesResult = await query(certificatesQuery, queryParams);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM certificates c
        JOIN students s ON c.student_id = s.student_id
        JOIN courses course ON c.course_id = course.course_id
        ${whereClause}
      `;

      const countResult = await query(countQuery, queryParams.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      return {
        certificates: certificatesResult.rows,
        total,
        page,
        limit
      };

    } catch (error) {
      logger.error('Failed to get certificates:', error);
      throw error;
    }
  }
}
