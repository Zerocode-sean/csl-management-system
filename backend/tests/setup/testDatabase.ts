import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

/**
 * Test database utilities
 */
export class TestDatabase {
  private static pool: Pool;

  /**
   * Get database connection pool
   */
  static getPool(): Pool {
    if (!this.pool) {
      this.pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'csl_user',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'csl_test_db',
        max: 5,
      });
    }
    return this.pool;
  }

  /**
   * Execute a query
   */
  static async query(text: string, params?: any[]) {
    const pool = this.getPool();
    return pool.query(text, params);
  }

  /**
   * Clean specific tables
   */
  static async cleanTables(tables: string[]) {
    const pool = this.getPool();
    for (const table of tables) {
      await pool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
    }
  }

  /**
   * Clean all tables
   */
  static async cleanAllTables() {
    await this.cleanTables([
      'audit_logs',
      'certificates',
      'students',
      'courses',
      'users',
    ]);
  }

  /**
   * Insert test student
   */
  static async createTestStudent(data: {
    studentCustomId: string;
    firstName: string;
    lastName: string;
    email: string;
    courseId: number;
  }) {
    const result = await this.query(
      `INSERT INTO students (student_custom_id, first_name, last_name, email, course_id, enrollment_date, status)
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, 'active')
       RETURNING *`,
      [data.studentCustomId, data.firstName, data.lastName, data.email, data.courseId]
    );
    return result.rows[0];
  }

  /**
   * Insert test course
   */
  static async createTestCourse(data: {
    courseCode: string;
    courseName: string;
    description?: string;
  }) {
    const result = await this.query(
      `INSERT INTO courses (course_code, course_name, description, duration_weeks)
       VALUES ($1, $2, $3, 12)
       RETURNING *`,
      [data.courseCode, data.courseName, data.description || 'Test course']
    );
    return result.rows[0];
  }

  /**
   * Insert test user
   */
  static async createTestUser(data: {
    username: string;
    email: string;
    role?: string;
  }) {
    const result = await this.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        data.username,
        data.email,
        '$2a$10$testhashdoesntmatterfortesting',
        data.role || 'admin',
      ]
    );
    return result.rows[0];
  }

  /**
   * Close database connections
   */
  static async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}
