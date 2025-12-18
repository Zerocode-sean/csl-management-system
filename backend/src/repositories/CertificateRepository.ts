import { query } from '../database/connection';
import { 
  Certificate, 
  IssueCertificateDTO, 
  CertificateSearchFilter, 
  CertificateVerificationResult,
  PaginationOptions, 
  PaginatedResponse,
  CertificateStatus 
} from '../types/models';
import { logger } from '../utils/logger';
import { generateCSLNumber, generateVerificationHash } from '../utils/certificateUtils';

export class CertificateRepository {
  
  /**
   * Issue a new certificate
   */
  async issue(data: IssueCertificateDTO, issuedBy: number): Promise<Certificate> {
    const cslNumber = await generateCSLNumber();
    const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const verificationHash = generateVerificationHash(cslNumber, data.student_id, data.course_id);

    const sql = `
      INSERT INTO certificates (
        certificate_number, csl_number, student_id, course_id,
        issue_date, completion_date, grade, gpa, status,
        issued_by, verification_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const values = [
      certificateNumber,
      cslNumber,
      data.student_id,
      data.course_id,
      new Date(),
      new Date(data.completion_date),
      data.grade || null,
      data.gpa || null,
      CertificateStatus.ACTIVE,
      issuedBy,
      verificationHash
    ];

    try {
      const result = await query(sql, values);
      logger.info('Certificate issued', { 
        csl_number: cslNumber, 
        student_id: data.student_id, 
        course_id: data.course_id 
      });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to issue certificate', { data, error });
      throw error;
    }
  }

  /**
   * Find certificate by ID
   */
  async findById(id: number): Promise<Certificate | null> {
    const sql = 'SELECT * FROM certificates WHERE id = $1';
    
    try {
      const result = await query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to find certificate by ID', { id, error });
      throw error;
    }
  }

  /**
   * Find certificate by CSL number
   */
  async findByCSLNumber(cslNumber: string): Promise<Certificate | null> {
    const sql = 'SELECT * FROM certificates WHERE csl_number = $1';
    
    try {
      const result = await query(sql, [cslNumber]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to find certificate by CSL number', { cslNumber, error });
      throw error;
    }
  }

  /**
   * Verify certificate with full details
   */
  async verify(cslNumber: string): Promise<CertificateVerificationResult> {
    const sql = `
      SELECT 
        c.*, 
        s.first_name, s.last_name, s.student_id,
        co.course_name, co.course_code,
        u.first_name as issuer_first_name, u.last_name as issuer_last_name
      FROM certificates c
      JOIN students s ON c.student_id = s.id
      JOIN courses co ON c.course_id = co.id
      LEFT JOIN users u ON c.issued_by = u.id
      WHERE c.csl_number = $1
    `;

    try {
      const result = await query(sql, [cslNumber]);
      
      if (result.rows.length === 0) {
        return {
          valid: false,
          message: 'Certificate not found',
          verified_at: new Date().toISOString()
        };
      }

      const cert = result.rows[0];
      
      if (cert.status !== CertificateStatus.ACTIVE) {
        return {
          valid: false,
          message: `Certificate is ${cert.status}`,
          verified_at: new Date().toISOString()
        };
      }

      return {
        valid: true,
        certificate: {
          csl_number: cert.csl_number,
          student_name: `${cert.first_name} ${cert.last_name}`,
          course_name: cert.course_name,
          issue_date: cert.issue_date,
          completion_date: cert.completion_date,
          status: cert.status,
          grade: cert.grade
        },
        message: 'Certificate is valid',
        verified_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to verify certificate', { cslNumber, error });
      return {
        valid: false,
        message: 'Verification failed due to system error',
        verified_at: new Date().toISOString()
      };
    }
  }

  /**
   * Update certificate status
   */
  async updateStatus(id: number, status: CertificateStatus, updatedBy: number): Promise<Certificate> {
    const sql = `
      UPDATE certificates 
      SET status = $1, updated_at = $2
      WHERE id = $3
      RETURNING *
    `;

    try {
      const result = await query(sql, [status, new Date(), id]);
      if (result.rows.length === 0) {
        throw new Error('Certificate not found');
      }
      
      logger.info('Certificate status updated', { id, status, updated_by: updatedBy });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update certificate status', { id, status, error });
      throw error;
    }
  }

  /**
   * Search certificates with pagination
   */
  async search(
    filters: CertificateSearchFilter = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 20, sort_by = 'issue_date', sort_order = 'DESC' } = pagination;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (filters.search) {
      conditions.push(`(
        c.csl_number ILIKE $${paramCount} OR 
        c.certificate_number ILIKE $${paramCount} OR
        s.first_name ILIKE $${paramCount} OR
        s.last_name ILIKE $${paramCount} OR
        s.student_id ILIKE $${paramCount} OR
        co.course_name ILIKE $${paramCount}
      )`);
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    if (filters.status) {
      conditions.push(`c.status = $${paramCount++}`);
      values.push(filters.status);
    }

    if (filters.student_id) {
      conditions.push(`c.student_id = $${paramCount++}`);
      values.push(filters.student_id);
    }

    if (filters.course_id) {
      conditions.push(`c.course_id = $${paramCount++}`);
      values.push(filters.course_id);
    }

    if (filters.issue_date_from) {
      conditions.push(`c.issue_date >= $${paramCount++}`);
      values.push(new Date(filters.issue_date_from));
    }

    if (filters.issue_date_to) {
      conditions.push(`c.issue_date <= $${paramCount++}`);
      values.push(new Date(filters.issue_date_to));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countSql = `
      SELECT COUNT(*) as total 
      FROM certificates c
      JOIN students s ON c.student_id = s.id
      JOIN courses co ON c.course_id = co.id
      ${whereClause}
    `;
    const countResult = await query(countSql, values);
    const total = parseInt(countResult.rows[0].total);

    // Data query with joins
    const dataSql = `
      SELECT 
        c.*,
        s.first_name, s.last_name, s.student_id,
        co.course_name, co.course_code
      FROM certificates c
      JOIN students s ON c.student_id = s.id
      JOIN courses co ON c.course_id = co.id
      ${whereClause}
      ORDER BY c.${sort_by} ${sort_order}
      LIMIT $${paramCount++} OFFSET $${paramCount}
    `;
    
    values.push(limit, offset);

    try {
      const result = await query(dataSql, values);
      
      return {
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to search certificates', { filters, pagination, error });
      throw error;
    }
  }

  /**
   * Get certificates by student
   */
  async findByStudent(studentId: number): Promise<any[]> {
    const sql = `
      SELECT 
        c.*,
        co.course_name, co.course_code
      FROM certificates c
      JOIN courses co ON c.course_id = co.id
      WHERE c.student_id = $1
      ORDER BY c.issue_date DESC
    `;

    try {
      const result = await query(sql, [studentId]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to find certificates by student', { studentId, error });
      throw error;
    }
  }

  /**
   * Get certificates by course
   */
  async findByCourse(courseId: number): Promise<any[]> {
    const sql = `
      SELECT 
        c.*,
        s.first_name, s.last_name, s.student_id
      FROM certificates c
      JOIN students s ON c.student_id = s.id
      WHERE c.course_id = $1
      ORDER BY c.issue_date DESC
    `;

    try {
      const result = await query(sql, [courseId]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to find certificates by course', { courseId, error });
      throw error;
    }
  }

  /**
   * Check if certificate exists for student and course
   */
  async existsForStudentCourse(studentId: number, courseId: number): Promise<boolean> {
    const sql = `
      SELECT 1 FROM certificates 
      WHERE student_id = $1 AND course_id = $2 
      AND status = $3
    `;

    try {
      const result = await query(sql, [studentId, courseId, CertificateStatus.ACTIVE]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Failed to check certificate existence', { studentId, courseId, error });
      throw error;
    }
  }

  /**
   * Get certificate statistics
   */
  async getStatistics(): Promise<{
    total: number;
    by_status: { status: string; count: number }[];
    recent_issued: number;
  }> {
    const totalSql = 'SELECT COUNT(*) as count FROM certificates';
    const statusSql = `
      SELECT status, COUNT(*) as count 
      FROM certificates 
      GROUP BY status 
      ORDER BY count DESC
    `;
    const recentSql = `
      SELECT COUNT(*) as count 
      FROM certificates 
      WHERE issue_date >= NOW() - INTERVAL '30 days'
    `;

    try {
      const [totalResult, statusResult, recentResult] = await Promise.all([
        query(totalSql),
        query(statusSql),
        query(recentSql)
      ]);

      return {
        total: parseInt(totalResult.rows[0].count),
        by_status: statusResult.rows,
        recent_issued: parseInt(recentResult.rows[0].count)
      };
    } catch (error) {
      logger.error('Failed to get certificate statistics', { error });
      throw error;
    }
  }
}
