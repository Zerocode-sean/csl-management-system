import { query } from '../database/connection';
import { 
  Student, 
  CreateStudentDTO, 
  UpdateStudentDTO, 
  StudentSearchFilter, 
  PaginationOptions, 
  PaginatedResponse,
  StudentStatus 
} from '../types/models';
import { logger } from '../utils/logger';

export class StudentRepository {
  
  /**
   * Create a new student
   */
  async create(data: CreateStudentDTO): Promise<Student> {
    const sql = `
      INSERT INTO students (
        student_id, first_name, last_name, email, phone, 
        date_of_birth, address, enrollment_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      data.student_id,
      data.first_name,
      data.last_name,
      data.email,
      data.phone || null,
      data.date_of_birth ? new Date(data.date_of_birth) : null,
      data.address || null,
      data.enrollment_date ? new Date(data.enrollment_date) : new Date(),
      StudentStatus.ACTIVE
    ];

    try {
      const result = await query(sql, values);
      logger.info('Student created', { student_id: data.student_id });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create student', { data, error });
      throw error;
    }
  }

  /**
   * Find student by ID
   */
  async findById(id: number): Promise<Student | null> {
    const sql = 'SELECT * FROM students WHERE id = $1';
    
    try {
      const result = await query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to find student by ID', { id, error });
      throw error;
    }
  }

  /**
   * Find student by student ID
   */
  async findByStudentId(studentId: string): Promise<Student | null> {
    const sql = 'SELECT * FROM students WHERE student_id = $1';
    
    try {
      const result = await query(sql, [studentId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to find student by student ID', { studentId, error });
      throw error;
    }
  }

  /**
   * Update student
   */
  async update(id: number, data: UpdateStudentDTO): Promise<Student> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.first_name !== undefined) {
      fields.push(`first_name = $${paramCount++}`);
      values.push(data.first_name);
    }
    if (data.last_name !== undefined) {
      fields.push(`last_name = $${paramCount++}`);
      values.push(data.last_name);
    }
    if (data.email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(data.email);
    }
    if (data.phone !== undefined) {
      fields.push(`phone = $${paramCount++}`);
      values.push(data.phone);
    }
    if (data.address !== undefined) {
      fields.push(`address = $${paramCount++}`);
      values.push(data.address);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(data.status);
    }

    fields.push(`updated_at = $${paramCount++}`);
    values.push(new Date());
    values.push(id);

    const sql = `
      UPDATE students 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    try {
      const result = await query(sql, values);
      if (result.rows.length === 0) {
        throw new Error('Student not found');
      }
      logger.info('Student updated', { id });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update student', { id, data, error });
      throw error;
    }
  }

  /**
   * Delete student (soft delete)
   */
  async delete(id: number): Promise<void> {
    const sql = `
      UPDATE students 
      SET status = $1, updated_at = $2 
      WHERE id = $3
    `;

    try {
      const result = await query(sql, [StudentStatus.WITHDRAWN, new Date(), id]);
      if (result.rowCount === 0) {
        throw new Error('Student not found');
      }
      logger.info('Student deleted (soft)', { id });
    } catch (error) {
      logger.error('Failed to delete student', { id, error });
      throw error;
    }
  }

  /**
   * Search students with pagination
   */
  async search(
    filters: StudentSearchFilter = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResponse<Student>> {
    const { page = 1, limit = 20, sort_by = 'created_at', sort_order = 'DESC' } = pagination;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (filters.search) {
      conditions.push(`(
        first_name ILIKE $${paramCount} OR 
        last_name ILIKE $${paramCount} OR 
        student_id ILIKE $${paramCount} OR 
        email ILIKE $${paramCount}
      )`);
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    if (filters.status) {
      conditions.push(`status = $${paramCount++}`);
      values.push(filters.status);
    }

    if (filters.enrollment_year) {
      conditions.push(`EXTRACT(YEAR FROM enrollment_date) = $${paramCount++}`);
      values.push(filters.enrollment_year);
    }

    if (filters.graduation_year) {
      conditions.push(`EXTRACT(YEAR FROM graduation_date) = $${paramCount++}`);
      values.push(filters.graduation_year);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countSql = `SELECT COUNT(*) as total FROM students ${whereClause}`;
    const countResult = await query(countSql, values);
    const total = parseInt(countResult.rows[0].total);

    // Data query
    const dataSql = `
      SELECT * FROM students 
      ${whereClause}
      ORDER BY ${sort_by} ${sort_order}
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
      logger.error('Failed to search students', { filters, pagination, error });
      throw error;
    }
  }

  /**
   * Get students by course
   */
  async findByCourse(courseId: number): Promise<Student[]> {
    const sql = `
      SELECT s.* FROM students s
      JOIN enrollments e ON s.id = e.student_id
      WHERE e.course_id = $1 AND e.status IN ('enrolled', 'in_progress', 'completed')
      ORDER BY s.last_name, s.first_name
    `;

    try {
      const result = await query(sql, [courseId]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to find students by course', { courseId, error });
      throw error;
    }
  }

  /**
   * Check if student ID exists
   */
  async existsByStudentId(studentId: string, excludeId?: number): Promise<boolean> {
    let sql = 'SELECT 1 FROM students WHERE student_id = $1';
    const values: any[] = [studentId];

    if (excludeId) {
      sql += ' AND id != $2';
      values.push(excludeId);
    }

    try {
      const result = await query(sql, values);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Failed to check student ID existence', { studentId, error });
      throw error;
    }
  }

  /**
   * Check if email exists
   */
  async existsByEmail(email: string, excludeId?: number): Promise<boolean> {
    let sql = 'SELECT 1 FROM students WHERE email = $1';
    const values: any[] = [email];

    if (excludeId) {
      sql += ' AND id != $2';
      values.push(excludeId);
    }

    try {
      const result = await query(sql, values);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Failed to check email existence', { email, error });
      throw error;
    }
  }
}
