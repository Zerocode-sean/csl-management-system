import crypto from 'crypto';
import { getPool } from '../database/connection';
import { logger } from '../utils/logger';

const SECRET_PEPPER = process.env['CSL_SECRET_PEPPER'] || 'change-this-in-production';

/**
 * CSL Generator Service
 * Generates and verifies CSL numbers according to cloud.md specification
 * Format: YYYY-CC-NNNN-VVVVVV
 */
export class CSLGeneratorService {
  /**
   * Generate a unique CSL number
   * Format: YYYY-CC-NNNN-VVVVVV
   * Example: 2025-KBA-0042-9F8C2B
   * 
   * @param studentId - Database ID of the student
   * @param courseId - Database ID of the course
   * @returns Promise<string> - The generated CSL number
   */
  static async generateCSLNumber(
    studentId: number,
    courseId: number
  ): Promise<string> {
    try {
      // 1. Get course code
      const pool = getPool();
      const courseResult = await pool.query(
        'SELECT code FROM courses WHERE course_id = $1',
        [courseId]
      );

      if (courseResult.rows.length === 0) {
        throw new Error('Course not found');
      }

      const courseCode = courseResult.rows[0].code;
      const year = new Date().getFullYear();

      // 2. Get or create sequence number using database function
      const sequenceResult = await pool.query(
        'SELECT get_next_sequential_number($1, $2) as next_number',
        [year, courseCode]
      );

      const sequence = sequenceResult.rows[0].next_number;
      const paddedSequence = String(sequence).padStart(4, '0');

      // 3. Generate core CSL (without hash)
      const coreCSL = `${year}-${courseCode}-${paddedSequence}`;

      // 4. Generate cryptographic hash
      const hashInput = `${coreCSL}-${studentId}-${SECRET_PEPPER}`;
      const fullHash = crypto
        .createHash('sha256')
        .update(hashInput)
        .digest('hex');

      const verificationCode = fullHash.substring(0, 6).toUpperCase();

      // 5. Final CSL number
      const cslNumber = `${coreCSL}-${verificationCode}`;

      logger.info('CSL number generated', {
        cslNumber,
        studentId,
        courseId,
        year,
        courseCode,
        sequence
      });

      return cslNumber;
    } catch (error) {
      logger.error('Failed to generate CSL number', { error, studentId, courseId });
      throw error;
    }
  }

  /**
   * Verify if a CSL number is valid
   * Checks both format and cryptographic authenticity
   * 
   * @param cslNumber - CSL number to verify
   * @returns Promise<boolean> - True if valid, false otherwise
   */
  static async verifyCSLNumber(cslNumber: string): Promise<boolean> {
    try {
      // 1. Validate format
      const parts = cslNumber.split('-');
      if (parts.length !== 4) {
        logger.warn('Invalid CSL format: incorrect number of parts', { cslNumber });
        return false;
      }

      const [year, courseCode, sequence, providedHash] = parts;

      // Validate all parts exist
      if (!year || !courseCode || !sequence || !providedHash) {
        logger.warn('Invalid CSL format: missing parts', { cslNumber });
        return false;
      }

      // Validate year format (4 digits)
      if (!/^\d{4}$/.test(year)) {
        logger.warn('Invalid CSL format: invalid year', { cslNumber, year });
        return false;
      }

      // Validate course code format (2 uppercase letters)
      if (!/^[A-Z]{2}$/.test(courseCode)) {
        logger.warn('Invalid CSL format: invalid course code', { cslNumber, courseCode });
        return false;
      }

      // Validate sequence format (4 digits)
      if (!/^\d{4}$/.test(sequence)) {
        logger.warn('Invalid CSL format: invalid sequence', { cslNumber, sequence });
        return false;
      }

      // Validate hash format (6 alphanumeric uppercase)
      if (!/^[A-Z0-9]{6}$/.test(providedHash)) {
        logger.warn('Invalid CSL format: invalid hash', { cslNumber, providedHash });
        return false;
      }

      // 2. Get certificate from database
      const pool = getPool();
      const certResult = await pool.query(
        'SELECT student_id FROM certificates WHERE csl_number = $1',
        [cslNumber]
      );

      if (certResult.rows.length === 0) {
        logger.warn('CSL number not found in database', { cslNumber });
        return false;
      }

      const studentId = certResult.rows[0].student_id;

      // 3. Verify cryptographic hash
      const coreCSL = `${year}-${courseCode}-${sequence}`;
      const hashInput = `${coreCSL}-${studentId}-${SECRET_PEPPER}`;
      const fullHash = crypto
        .createHash('sha256')
        .update(hashInput)
        .digest('hex');

      const expectedHash = fullHash.substring(0, 6).toUpperCase();

      const isValid = expectedHash === providedHash;

      if (!isValid) {
        logger.warn('CSL cryptographic verification failed', {
          cslNumber,
          expectedHash,
          providedHash,
          studentId
        });
      } else {
        logger.info('CSL verified successfully', { cslNumber });
      }

      return isValid;
    } catch (error) {
      logger.error('CSL verification error', { error, cslNumber });
      return false;
    }
  }

  /**
   * Parse CSL number into components
   * 
   * @param cslNumber - CSL number to parse
   * @returns Object with year, courseCode, sequence, and hash, or null if invalid
   */
  static parseCSL(cslNumber: string): {
    year: string;
    courseCode: string;
    sequence: string;
    hash: string;
  } | null {
    const parts = cslNumber.split('-');
    
    if (parts.length !== 4) {
      return null;
    }

    const year = parts[0];
    const courseCode = parts[1];
    const sequence = parts[2];
    const hash = parts[3];

    // Validate format
    if (
      !year || !/^\d{4}$/.test(year) ||
      !courseCode || !/^[A-Z]{2,10}$/.test(courseCode) ||
      !sequence || !/^\d{4}$/.test(sequence) ||
      !hash || !/^[A-Z0-9]{6}$/.test(hash)
    ) {
      return null;
    }

    return {
      year,
      courseCode,
      sequence,
      hash
    };
  }

  /**
   * Validate CSL format without database lookup
   * Quick validation for format only
   * 
   * @param cslNumber - CSL number to validate
   * @returns boolean - True if format is valid
   */
  static validateCSLFormat(cslNumber: string): boolean {
    const cslRegex = /^\d{4}-[A-Z]{2,10}-\d{4}-[A-Z0-9]{6}$/;
    return cslRegex.test(cslNumber);
  }
}
