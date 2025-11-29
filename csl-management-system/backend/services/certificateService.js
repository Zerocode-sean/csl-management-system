const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');

/**
 * Certificate Service for CSL Management System
 * Handles certificate generation, serial number creation, and PDF generation
 */
class CertificateService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Generate serial number in format YYYY-CC-NNNN-VVVVVV
   * @param {number} studentId - Student ID
   * @param {number} courseId - Course ID  
   * @param {string} courseCode - Course code (2 letters)
   * @returns {Promise<Object>} - Serial number components
   */
  async generateSerialNumber(studentId, courseId, courseCode = null) {
    try {
      const currentYear = new Date().getFullYear();
      
      // Use provided course code or get from database
      let finalCourseCode = courseCode;
      if (!finalCourseCode && this.db) {
        const courseQuery = `
          SELECT code FROM courses WHERE course_id = $1
        `;
        const courseResult = await this.db.query(courseQuery, [courseId]);
        
        if (courseResult.rows.length === 0) {
          throw new Error('Course not found');
        }
        
        finalCourseCode = courseResult.rows[0].code.toUpperCase();
      } else if (!finalCourseCode) {
        // Default course code for mock data
        finalCourseCode = 'CS';
      }
      
      finalCourseCode = finalCourseCode.toUpperCase();
      
      // Get next sequential number for this year and course
      let nextSequential = 1;
      if (this.db) {
        const sequentialQuery = `
          SELECT COALESCE(MAX(
            CAST(SUBSTRING(csl_number FROM 9 FOR 4) AS INTEGER)
          ), 0) as max_seq
          FROM certificates 
          WHERE course_id = $1 
          AND SUBSTRING(csl_number FROM 1 FOR 4) = $2
        `;
        
        const sequentialResult = await this.db.query(sequentialQuery, [courseId, currentYear.toString()]);
        nextSequential = (sequentialResult.rows[0].max_seq || 0) + 1;
      } else {
        // For mock data, use a random sequential number
        nextSequential = Math.floor(Math.random() * 9999) + 1;
      }
      
      // Format sequential number with zero padding
      const sequentialPart = nextSequential.toString().padStart(4, '0');
      
      // Generate verification hash
      const hashInput = `${studentId}-${courseId}-${currentYear}-${sequentialPart}`;
      const hash = crypto.createHash('sha256').update(hashInput).digest('hex');
      const verificationHash = hash.substring(0, 6).toUpperCase();
      
      // Construct full serial number
      const serialNumber = `${currentYear}-${finalCourseCode}-${sequentialPart}-${verificationHash}`;
      
      return {
        serialNumber,
        year: currentYear,
        courseCode: finalCourseCode,
        sequentialPart: nextSequential,
        verificationHash
      };
    } catch (error) {
      console.error('Error generating serial number:', error);
      throw error;
    }
  }

  /**
   * Create a new certificate record in database
   * @param {number} studentId - Student ID
   * @param {number} courseId - Course ID
   * @param {number} issuedBy - Admin ID who issued the certificate
   * @returns {Promise<Object>} - Created certificate data
   */
  async createCertificate(studentId, courseId, issuedBy) {
    try {
      const serialData = await this.generateSerialNumber(studentId, courseId);
      
      const insertQuery = `
        INSERT INTO certificates (
          csl_number, 
          student_id, 
          course_id, 
          issued_by_admin_id,
          issue_date,
          status
        ) VALUES ($1, $2, $3, $4, CURRENT_DATE, 'active')
        RETURNING *
      `;
      
      const result = await this.db.query(insertQuery, [
        serialData.serialNumber,
        studentId,
        courseId,
        issuedBy
      ]);
      
      return {
        ...result.rows[0],
        serialData
      };
    } catch (error) {
      console.error('Error creating certificate:', error);
      throw error;
    }
  }

  /**
   * Get certificate data with student and course information
   * @param {string} cslNumber - Certificate serial number
   * @returns {Promise<Object>} - Complete certificate data
   */
  async getCertificateData(cslNumber) {
    try {
      const query = `
        SELECT 
          c.csl_number,
          c.issue_date,
          c.status,
          s.name as student_name,
          s.student_custom_id,
          s.email as student_email,
          co.title as course_name,
          co.code as course_code,
          co.description as course_description,
          co.duration_months,
          a.first_name || ' ' || a.last_name as issued_by_name
        FROM certificates c
        JOIN students s ON c.student_id = s.student_id
        JOIN courses co ON c.course_id = co.course_id
        LEFT JOIN admins a ON c.issued_by_admin_id = a.admin_id
        WHERE c.csl_number = $1
      `;
      
      const result = await this.db.query(query, [cslNumber]);
      
      if (result.rows.length === 0) {
        throw new Error('Certificate not found');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error getting certificate data:', error);
      throw error;
    }
  }

  /**
   * Generate certificate PDF from HTML template
   * @param {Object} certificateData - Certificate information
   * @returns {Promise<Buffer>} - PDF buffer
   */
  async generateCertificatePDF(certificateData) {
    let browser;
    try {
      // Read HTML template
      const templatePath = path.join(__dirname, '../templates/certificate_template.html');
      let htmlTemplate = await fs.readFile(templatePath, 'utf8');
      
      // Replace placeholders with actual data
      const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long', 
          day: 'numeric'
        });
      };
      
      htmlTemplate = htmlTemplate
        .replace(/{{student_name}}/g, certificateData.student_name)
        .replace(/{{course_name}}/g, certificateData.course_name)
        .replace(/{{course_code}}/g, certificateData.course_code)
        .replace(/{{serial_number}}/g, certificateData.csl_number)
        .replace(/{{issue_date}}/g, formatDate(certificateData.issue_date))
        .replace(/{{duration}}/g, certificateData.duration_months)
        .replace(/{{issued_by}}/g, certificateData.issued_by_name || 'CSL Administration');
      
      // Launch puppeteer with improved settings
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ],
        timeout: 60000
      });
      
      const page = await browser.newPage();
      
      // Set content and wait for fonts/images to load with timeout
      await page.setContent(htmlTemplate, {
        waitUntil: ['domcontentloaded'],
        timeout: 30000
      });
      
      // Wait a bit for fonts to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in', 
          bottom: '0.5in',
          left: '0.5in'
        }
      });
      
      return pdfBuffer;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Verify certificate authenticity
   * @param {string} cslNumber - Certificate serial number
   * @returns {Promise<Object>} - Verification result
   */
  async verifyCertificate(cslNumber) {
    try {
      // Parse serial number components
      const parts = cslNumber.split('-');
      if (parts.length !== 4) {
        return { valid: false, message: 'Invalid serial number format' };
      }
      
      const [year, courseCode, sequential, providedHash] = parts;
      
      // Get certificate from database
      const certificateData = await this.getCertificateData(cslNumber);
      
      if (!certificateData) {
        return { valid: false, message: 'Certificate not found' };
      }
      
      if (certificateData.status !== 'active') {
        return { 
          valid: false, 
          message: `Certificate is ${certificateData.status}`,
          certificate: certificateData
        };
      }
      
      // Verify hash
      const studentQuery = `
        SELECT student_id FROM certificates WHERE csl_number = $1
      `;
      const studentResult = await this.db.query(studentQuery, [cslNumber]);
      const studentId = studentResult.rows[0].student_id;
      
      const courseQuery = `
        SELECT course_id FROM certificates WHERE csl_number = $1
      `;
      const courseResult = await this.db.query(courseQuery, [cslNumber]);
      const courseId = courseResult.rows[0].course_id;
      
      const hashInput = `${studentId}-${courseId}-${year}-${sequential}`;
      const calculatedHash = crypto.createHash('sha256').update(hashInput).digest('hex');
      const expectedHash = calculatedHash.substring(0, 6).toUpperCase();
      
      if (providedHash !== expectedHash) {
        return { valid: false, message: 'Certificate hash verification failed' };
      }
      
      return {
        valid: true,
        message: 'Certificate is authentic and valid',
        certificate: certificateData
      };
    } catch (error) {
      console.error('Error verifying certificate:', error);
      return { valid: false, message: 'Verification failed due to system error' };
    }
  }

  /**
   * Verify certificate authenticity (mock version for development)
   * @param {string} cslNumber - Certificate serial number
   * @param {Array} students - Mock students array
   * @param {Array} courses - Mock courses array
   * @returns {Promise<Object>} - Verification result
   */
  async verifyCertificateMock(cslNumber, students, courses) {
    try {
      // Parse serial number components
      const parts = cslNumber.split('-');
      if (parts.length !== 4) {
        return { valid: false, message: 'Invalid serial number format' };
      }
      
      const [year, courseCode, sequential, providedHash] = parts;
      
      // Find course by code
      const course = courses.find(c => c.code.toUpperCase() === courseCode);
      if (!course) {
        return { valid: false, message: 'Course not found for this certificate' };
      }
      
      // Mock certificate data (in real app, this would come from database)
      const mockCertificateData = {
        csl_number: cslNumber,
        issue_date: new Date(),
        status: 'active',
        student_name: 'Mock Student',
        student_custom_id: 'STU001',
        student_email: 'student@example.com',
        course_name: course.title,
        course_code: course.code,
        course_description: course.description,
        duration_months: course.duration_months,
        issued_by_name: 'CSL Administration'
      };
      
      return {
        valid: true,
        message: 'Certificate is authentic and valid (mock verification)',
        certificate: mockCertificateData
      };
    } catch (error) {
      console.error('Error verifying certificate:', error);
      return { valid: false, message: 'Verification failed due to system error' };
    }
  }
}

module.exports = CertificateService;
