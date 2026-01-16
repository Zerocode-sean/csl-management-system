import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import { getPool } from '../database/connection';
import { CSLGeneratorService } from './cslGenerator.service';
import { logger } from '../utils/logger';

interface CertificateData {
  studentName: string;
  courseName: string;
  completionDate: string;
  startDate: string;
  issueDate: string;
  duration: string;
  cslNumber: string;
  directorName: string;
  qrCodeDataUrl: string;
}

/**
 * Certificate Generator Service
 * Generates PDF certificates with QR codes and manages database transactions
 * According to cloud.md specification (lines 330-588)
 */
export class CertificateGeneratorService {
  /**
   * Generate certificate HTML template
   * Reads from certificate.html file and replaces placeholders
   */
  private static async generateHTML(data: CertificateData): Promise<string> {
    // Try primary template path, but fall back to legacy template(s) if needed
    const primaryTemplate = path.join(process.cwd(), 'src/templates/certificate.html');
    const altTemplate1 = path.join(process.cwd(), 'backend', 'templates', 'certificate-emesa.html');
    const altTemplate2 = path.join(process.cwd(), 'backend', 'templates', 'certificate_template_new.html');

    let templatePath = primaryTemplate;
    if (!fs.existsSync(templatePath)) {
      if (fs.existsSync(altTemplate1)) {
        templatePath = altTemplate1;
      } else if (fs.existsSync(altTemplate2)) {
        templatePath = altTemplate2;
      }
    }

    logger.info(`Reading template from: ${templatePath}`);

    // Read the template file
    let template = fs.readFileSync(templatePath, 'utf-8');

    logger.info('Template loaded successfully, replacing placeholders...');

    // Get logo as base64 for embedding. Try a few likely locations so container/host path differences don't break rendering.
    const candidateLogoNames = [
      'WhatsApp Image 2025-11-21 at 10.39.29_f08a778d.jpg',
      'logo.jpg',
      'logo.png'
    ];

    const candidateLogoPaths = [
      path.join(process.cwd(), 'logo'),
      path.join(__dirname, '../../logo'),
      path.join(process.cwd(), '..', 'logo')
    ];

    let logoDataUrl = '';
    let foundLogoPath = '';

    for (const base of candidateLogoPaths) {
      for (const name of candidateLogoNames) {
        const p = path.join(base, name);
        if (fs.existsSync(p)) {
          foundLogoPath = p;
          break;
        }
      }
      if (foundLogoPath) break;
    }

    if (foundLogoPath) {
      try {
        const logoBuffer = fs.readFileSync(foundLogoPath);
        const ext = path.extname(foundLogoPath).toLowerCase();
        const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
        logoDataUrl = `data:${mime};base64,${logoBuffer.toString('base64')}`;
        logger.info('Logo loaded successfully from: ' + foundLogoPath);
      } catch (err) {
        logger.warn('Failed to read logo file at: ' + foundLogoPath, { error: err });
      }
    } else {
      logger.warn('Logo file not found in any candidate path');
    }

    // Replace all placeholders. Accept both upper- and lower-case logo placeholders for backwards compatibility.
    template = template
      .replace(/{{CSL_NUMBER}}/g, data.cslNumber)
      .replace(/{{STUDENT_NAME}}/g, data.studentName)
      .replace(/{{COURSE_NAME}}/g, data.courseName)
      .replace(/{{COURSE_CODE}}/g, data.courseName) // Using courseName as placeholder for technologies
      .replace(/{{COMPLETION_DATE}}/g, data.completionDate)
      .replace(/{{START_DATE}}/g, data.startDate)
      .replace(/{{ISSUE_DATE}}/g, data.issueDate)
      .replace(/{{DURATION}}/g, data.duration)
      .replace(/{{ISSUED_BY}}/g, data.directorName)
      .replace(/{{QR_CODE}}/g, data.qrCodeDataUrl)
      .replace(/{{STUDENT_ID}}/g, '') // Not available in current data structure
      .replace(/{{LOGO_URL}}/g, logoDataUrl)
      .replace(/{{logo_path}}/g, logoDataUrl);

    logger.info('All placeholders replaced successfully');
    
    return template;
  }

  /**
   * Generate certificate PDF
   * According to cloud.md lines 485-586
   * 
   * @param studentId - Database ID of the student
   * @param courseId - Database ID of the course
   * @param adminId - Database ID of the admin issuing the certificate
   * @returns Object containing cslNumber and pdfPath
   */
  static async generateCertificate(
    studentId: number,
    courseId: number,
    adminId: number
  ): Promise<{ cslNumber: string; pdfPath: string }> {
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get student and course details
      const studentResult = await client.query(
        'SELECT * FROM students WHERE student_id = $1',
        [studentId]
      );

      const courseResult = await client.query(
        'SELECT * FROM courses WHERE course_id = $1',
        [courseId]
      );

      if (studentResult.rows.length === 0 || courseResult.rows.length === 0) {
        throw new Error('Student or course not found');
      }

      const student = studentResult.rows[0];
      const course = courseResult.rows[0];

      // Get student_courses enrollment data
      const enrollmentResult = await client.query(
        'SELECT enrollment_date, completion_date FROM student_courses WHERE student_id = $1 AND course_id = $2',
        [studentId, courseId]
      );

      // Calculate dates
      const completionDate = new Date();
      const durationMonths = course.duration_months || 3;
      let startDate = new Date(completionDate);
      startDate.setMonth(startDate.getMonth() - durationMonths);

      // If enrollment data exists, use it
      if (enrollmentResult.rows.length > 0 && enrollmentResult.rows[0].enrollment_date) {
        startDate = new Date(enrollmentResult.rows[0].enrollment_date);
        if (enrollmentResult.rows[0].completion_date) {
          const actualCompletion = new Date(enrollmentResult.rows[0].completion_date);
          const monthsDiff = (actualCompletion.getFullYear() - startDate.getFullYear()) * 12 
                           + (actualCompletion.getMonth() - startDate.getMonth());
          if (monthsDiff > 0) {
            // Use actual duration
            course.duration_months = monthsDiff;
          }
        }
      }

      // Check for existing certificate
      const existingCert = await client.query(
        'SELECT csl_number FROM certificates WHERE student_id = $1 AND course_id = $2 AND status = $3',
        [studentId, courseId, 'active']
      );

      if (existingCert.rows.length > 0) {
        throw new Error('Certificate already exists for this student and course');
      }

      // Generate CSL number
      const cslNumber = await CSLGeneratorService.generateCSLNumber(studentId, courseId);

      // Generate QR code
      const publicUrl = process.env['PUBLIC_URL'] || 'http://localhost:3000';
      const verificationUrl = `${publicUrl}/verify/${cslNumber}`;
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);

      // Prepare certificate data
      const certificateData: CertificateData = {
        studentName: student.name.toUpperCase(),
        courseName: course.title,
        completionDate: completionDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        startDate: startDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        issueDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        duration: `${course.duration_months || 3} months`,
        cslNumber: cslNumber,
        directorName: 'CPA EMELDA NYONGESA',
        qrCodeDataUrl: qrCodeDataUrl
      };

      // Generate PDF
      const html = await this.generateHTML(certificateData);
      const launchOptions: any = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--ignore-certificate-errors'
        ]
      };

      if (process.env['PUPPETEER_EXECUTABLE_PATH']) {
        launchOptions.executablePath = process.env['PUPPETEER_EXECUTABLE_PATH'];
      }

      const browser = await puppeteer.launch(launchOptions);

      const page = await browser.newPage();
      // Use 'domcontentloaded' instead of 'networkidle0' to avoid hanging on external resources
      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });

      const certificatesDir = path.join(__dirname, '../../certificates');
      if (!fs.existsSync(certificatesDir)) {
        fs.mkdirSync(certificatesDir, { recursive: true });
      }

      const pdfFileName = `${cslNumber}.pdf`;
      const pdfPath = path.join(certificatesDir, pdfFileName);

      await page.pdf({
        path: pdfPath,
        format: 'A4',
        landscape: true,
        printBackground: true
      });

      await browser.close();

      // Save to database with verification hash
      const crypto = require('crypto');
      const SECRET_PEPPER = process.env['CSL_SECRET_PEPPER'] || 'change-this-in-production';
      const fullHash = crypto
        .createHash('sha256')
        .update(`${cslNumber}-${studentId}-${SECRET_PEPPER}`)
        .digest('hex');

      await client.query(
        `INSERT INTO certificates (
          csl_number, student_id, course_id, issued_by_admin_id, status
        ) VALUES ($1, $2, $3, $4, 'active')`,
        [cslNumber, studentId, courseId, adminId]
      );

      // Update student_courses
      await client.query(
        `UPDATE student_courses
         SET status = 'completed', completion_date = $1
         WHERE student_id = $2 AND course_id = $3`,
        [new Date(), studentId, courseId]
      );

      // Audit log
      await client.query(
        `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, new_values)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          adminId,
          'CREATE',
          'certificate',
          cslNumber,
          JSON.stringify({
            csl_number: cslNumber,
            student_id: studentId,
            course_id: courseId
          })
        ]
      );

      await client.query('COMMIT');

      logger.info('Certificate generated successfully', {
        cslNumber,
        studentId,
        courseId,
        adminId,
        pdfPath
      });

      return { cslNumber, pdfPath };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to generate certificate', {
        error,
        studentId,
        courseId,
        adminId
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get PDF path for a certificate
   * @param cslNumber - CSL certificate number
   * @returns Full path to PDF file
   */
  static getPDFPath(cslNumber: string): string {
    const certificatesDir = path.join(__dirname, '../../certificates');
    return path.join(certificatesDir, `${cslNumber}.pdf`);
  }

  /**
   * Check if PDF exists for a certificate
   * @param cslNumber - CSL certificate number
   * @returns boolean indicating if PDF exists
   */
  static pdfExists(cslNumber: string): boolean {
    const pdfPath = this.getPDFPath(cslNumber);
    return fs.existsSync(pdfPath);
  }
}
