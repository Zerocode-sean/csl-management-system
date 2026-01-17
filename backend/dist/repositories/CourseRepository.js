"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseRepository = void 0;
const connection_1 = require("../database/connection");
const logger_1 = require("../utils/logger");
class CourseRepository {
    /**
     * Create a new course
     */
    async create(data) {
        const sql = `
      INSERT INTO courses (
        course_code, course_name, description, credits, 
        duration_hours, instructor_id, category, prerequisites
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
        const values = [
            data.course_code,
            data.course_name,
            data.description || null,
            data.credits,
            data.duration_hours,
            data.instructor_id || null,
            data.category,
            data.prerequisites || null
        ];
        try {
            const result = await (0, connection_1.query)(sql, values);
            logger_1.logger.info('Course created', { course_code: data.course_code });
            return result.rows[0];
        }
        catch (error) {
            logger_1.logger.error('Failed to create course', { data, error });
            throw error;
        }
    }
    /**
     * Find course by ID
     */
    async findById(id) {
        const sql = 'SELECT * FROM courses WHERE id = $1';
        try {
            const result = await (0, connection_1.query)(sql, [id]);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.logger.error('Failed to find course by ID', { id, error });
            throw error;
        }
    }
    /**
     * Find course by course code
     */
    async findByCourseCode(courseCode) {
        const sql = 'SELECT * FROM courses WHERE course_code = $1';
        try {
            const result = await (0, connection_1.query)(sql, [courseCode]);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.logger.error('Failed to find course by code', { courseCode, error });
            throw error;
        }
    }
    /**
     * Update course
     */
    async update(id, data) {
        const fields = [];
        const values = [];
        let paramCount = 1;
        if (data.course_name !== undefined) {
            fields.push(`course_name = $${paramCount++}`);
            values.push(data.course_name);
        }
        if (data.description !== undefined) {
            fields.push(`description = $${paramCount++}`);
            values.push(data.description);
        }
        if (data.credits !== undefined) {
            fields.push(`credits = $${paramCount++}`);
            values.push(data.credits);
        }
        if (data.duration_hours !== undefined) {
            fields.push(`duration_hours = $${paramCount++}`);
            values.push(data.duration_hours);
        }
        if (data.instructor_id !== undefined) {
            fields.push(`instructor_id = $${paramCount++}`);
            values.push(data.instructor_id);
        }
        if (data.category !== undefined) {
            fields.push(`category = $${paramCount++}`);
            values.push(data.category);
        }
        if (data.prerequisites !== undefined) {
            fields.push(`prerequisites = $${paramCount++}`);
            values.push(data.prerequisites);
        }
        if (data.is_active !== undefined) {
            fields.push(`is_active = $${paramCount++}`);
            values.push(data.is_active);
        }
        fields.push(`updated_at = $${paramCount++}`);
        values.push(new Date());
        values.push(id);
        const sql = `
      UPDATE courses 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
        try {
            const result = await (0, connection_1.query)(sql, values);
            if (result.rows.length === 0) {
                throw new Error('Course not found');
            }
            logger_1.logger.info('Course updated', { id });
            return result.rows[0];
        }
        catch (error) {
            logger_1.logger.error('Failed to update course', { id, data, error });
            throw error;
        }
    }
    /**
     * Delete course (soft delete)
     */
    async delete(id) {
        const sql = `
      UPDATE courses 
      SET is_active = false, updated_at = $1 
      WHERE id = $2
    `;
        try {
            const result = await (0, connection_1.query)(sql, [new Date(), id]);
            if (result.rowCount === 0) {
                throw new Error('Course not found');
            }
            logger_1.logger.info('Course deleted (soft)', { id });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete course', { id, error });
            throw error;
        }
    }
    /**
     * Search courses with pagination
     */
    async search(filters = {}, pagination = {}) {
        const { page = 1, limit = 20, sort_by = 'created_at', sort_order = 'DESC' } = pagination;
        const offset = (page - 1) * limit;
        // Build WHERE clause
        const conditions = [];
        const values = [];
        let paramCount = 1;
        if (filters.search) {
            conditions.push(`(
        course_code ILIKE $${paramCount} OR 
        course_name ILIKE $${paramCount} OR 
        description ILIKE $${paramCount} OR
        category ILIKE $${paramCount}
      )`);
            values.push(`%${filters.search}%`);
            paramCount++;
        }
        if (filters.category) {
            conditions.push(`category = $${paramCount++}`);
            values.push(filters.category);
        }
        if (filters.is_active !== undefined) {
            conditions.push(`is_active = $${paramCount++}`);
            values.push(filters.is_active);
        }
        if (filters.instructor_id) {
            conditions.push(`instructor_id = $${paramCount++}`);
            values.push(filters.instructor_id);
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        // Count query
        const countSql = `SELECT COUNT(*) as total FROM courses ${whereClause}`;
        const countResult = await (0, connection_1.query)(countSql, values);
        const total = parseInt(countResult.rows[0].total);
        // Data query
        const dataSql = `
      SELECT * FROM courses 
      ${whereClause}
      ORDER BY ${sort_by} ${sort_order}
      LIMIT $${paramCount++} OFFSET $${paramCount}
    `;
        values.push(limit, offset);
        try {
            const result = await (0, connection_1.query)(dataSql, values);
            return {
                data: result.rows,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to search courses', { filters, pagination, error });
            throw error;
        }
    }
    /**
     * Get all active courses
     */
    async findAllActive() {
        const sql = `
      SELECT * FROM courses 
      WHERE is_active = true 
      ORDER BY course_name
    `;
        try {
            const result = await (0, connection_1.query)(sql);
            return result.rows;
        }
        catch (error) {
            logger_1.logger.error('Failed to find active courses', { error });
            throw error;
        }
    }
    /**
     * Get courses by category
     */
    async findByCategory(category) {
        const sql = `
      SELECT * FROM courses 
      WHERE category = $1 AND is_active = true
      ORDER BY course_name
    `;
        try {
            const result = await (0, connection_1.query)(sql, [category]);
            return result.rows;
        }
        catch (error) {
            logger_1.logger.error('Failed to find courses by category', { category, error });
            throw error;
        }
    }
    /**
     * Check if course code exists
     */
    async existsByCourseCode(courseCode, excludeId) {
        let sql = 'SELECT 1 FROM courses WHERE course_code = $1';
        const values = [courseCode];
        if (excludeId) {
            sql += ' AND id != $2';
            values.push(String(excludeId));
        }
        try {
            const result = await (0, connection_1.query)(sql, values);
            return result.rows.length > 0;
        }
        catch (error) {
            logger_1.logger.error('Failed to check course code existence', { courseCode, error });
            throw error;
        }
    }
    /**
     * Get course statistics
     */
    async getStatistics() {
        const totalSql = 'SELECT COUNT(*) as count FROM courses';
        const activeSql = 'SELECT COUNT(*) as count FROM courses WHERE is_active = true';
        const categorySql = `
      SELECT category, COUNT(*) as count 
      FROM courses 
      WHERE is_active = true
      GROUP BY category 
      ORDER BY count DESC
    `;
        try {
            const [totalResult, activeResult, categoryResult] = await Promise.all([
                (0, connection_1.query)(totalSql),
                (0, connection_1.query)(activeSql),
                (0, connection_1.query)(categorySql)
            ]);
            return {
                total: parseInt(totalResult.rows[0].count),
                active: parseInt(activeResult.rows[0].count),
                by_category: categoryResult.rows
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get course statistics', { error });
            throw error;
        }
    }
}
exports.CourseRepository = CourseRepository;
