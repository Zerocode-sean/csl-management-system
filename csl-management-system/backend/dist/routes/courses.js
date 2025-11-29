"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const express_validator_1 = require("express-validator");
const connection_1 = require("../database/connection");
const logger_1 = require("../utils/logger");
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
// All course routes require authentication
router.use(auth_1.authenticateToken);
/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Get courses with pagination and search
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of courses
 */
router.get('/', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('search').optional().isString().trim(),
    (0, express_validator_1.query)('active').optional().isBoolean().toBoolean()
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map((err) => ({
            field: err.param,
            message: err.msg
        })));
    }
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const search = req.query.search;
    const activeFilter = req.query.active;
    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;
    // Active filter
    if (activeFilter !== undefined) {
        whereConditions.push(`c.is_active = $${paramIndex++}`);
        queryParams.push(activeFilter);
    }
    // Search filter
    if (search) {
        whereConditions.push(`(
        c.course_name ILIKE $${paramIndex} OR 
        c.course_code ILIKE $${paramIndex} OR 
        c.description ILIKE $${paramIndex}
      )`);
        queryParams.push(`%${search}%`);
        paramIndex++;
    }
    const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';
    // Get courses
    const coursesQuery = `
      SELECT 
        c.*,
        COUNT(cert.certificate_id) as certificate_count,
        COUNT(cert.certificate_id) FILTER (WHERE cert.status = 'active') as active_certificates
      FROM courses c
      LEFT JOIN certificates cert ON c.course_id = cert.course_id
      ${whereClause}
      GROUP BY c.course_id
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;
    queryParams.push(limit, offset);
    const coursesResult = await (0, connection_1.query)(coursesQuery, queryParams);
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM courses c
      ${whereClause}
    `;
    const countResult = await (0, connection_1.query)(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);
    res.json({
        success: true,
        data: {
            courses: coursesResult.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    });
}));
/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Course details
 *       404:
 *         description: Course not found
 */
router.get('/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Valid course ID is required')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map((err) => ({
            field: err.param,
            message: err.msg
        })));
    }
    const { id } = req.params;
    const courseResult = await (0, connection_1.query)(`
      SELECT 
        c.*,
        COUNT(cert.certificate_id) as certificate_count,
        COUNT(cert.certificate_id) FILTER (WHERE cert.status = 'active') as active_certificates
      FROM courses c
      LEFT JOIN certificates cert ON c.course_id = cert.course_id
      WHERE c.course_id = $1
      GROUP BY c.course_id
    `, [id]);
    if (courseResult.rows.length === 0) {
        throw (0, errorHandler_1.createError)('Course not found', 404);
    }
    // Get recent certificates for this course
    const certificatesResult = await (0, connection_1.query)(`
      SELECT 
        cert.certificate_id,
        cert.csl_number,
        cert.status,
        cert.issued_at,
        s.name as student_name,
        s.email as student_email
      FROM certificates cert
      JOIN students s ON cert.student_id = s.student_id
      WHERE cert.course_id = $1
      ORDER BY cert.issued_at DESC
      LIMIT 10
    `, [id]);
    const course = courseResult.rows[0];
    course.recent_certificates = certificatesResult.rows;
    res.json({
        success: true,
        data: course
    });
}));
/**
 * @swagger
 * /courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - course_code
 *               - course_name
 *               - duration_months
 *             properties:
 *               course_code:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 2
 *                 pattern: '^[A-Z]{2}$'
 *                 example: 'CS'
 *               course_name:
 *                 type: string
 *                 maxLength: 255
 *                 example: 'Computer Science'
 *               description:
 *                 type: string
 *                 example: 'Comprehensive computer science program'
 *               duration_months:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 60
 *                 example: 12
 *     responses:
 *       201:
 *         description: Course created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Course code already exists
 */
router.post('/', (0, auth_1.authorizeRoles)('super_admin', 'admin'), [
    (0, express_validator_1.body)('course_code')
        .isLength({ min: 2, max: 2 })
        .matches(/^[A-Z]{2}$/)
        .withMessage('Course code must be exactly 2 uppercase letters'),
    (0, express_validator_1.body)('course_name')
        .notEmpty()
        .isLength({ max: 255 })
        .withMessage('Course name is required and must be less than 255 characters'),
    (0, express_validator_1.body)('description').optional().isString(),
    (0, express_validator_1.body)('duration_months')
        .isInt({ min: 1, max: 60 })
        .withMessage('Duration must be between 1 and 60 months')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map((err) => ({
            field: err.param,
            message: err.msg
        })));
    }
    const { course_code, course_name, description, duration_months } = req.body;
    // Check if course code already exists
    const existingResult = await (0, connection_1.query)('SELECT course_id FROM courses WHERE course_code = $1', [course_code.toUpperCase()]);
    if (existingResult.rows.length > 0) {
        throw (0, errorHandler_1.createError)('Course code already exists', 409);
    }
    const courseId = (0, uuid_1.v4)();
    const result = await (0, connection_1.query)(`
      INSERT INTO courses (
        course_id, course_code, course_name, description, duration_months, is_active
      ) VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *
    `, [courseId, course_code.toUpperCase(), course_name, description, duration_months]);
    const course = result.rows[0];
    // Log the action
    await (0, connection_1.query)(`
      INSERT INTO audit_logs (
        admin_id, action, table_name, record_id, 
        new_values, ip_address, user_agent
      ) VALUES ($1, 'CREATE', 'courses', $2, $3, $4, $5)
    `, [
        req.admin.adminId,
        courseId,
        JSON.stringify(course),
        req.ip,
        req.get('User-Agent')
    ]);
    logger_1.logger.info('Course created successfully:', {
        courseId,
        courseCode: course_code,
        createdBy: req.admin.adminId
    });
    res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: course
    });
}));
/**
 * @swagger
 * /courses/{id}:
 *   put:
 *     summary: Update course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               course_name:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               duration_months:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 60
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       404:
 *         description: Course not found
 */
router.put('/:id', (0, auth_1.authorizeRoles)('super_admin', 'admin'), [
    (0, express_validator_1.param)('id').isUUID().withMessage('Valid course ID is required'),
    (0, express_validator_1.body)('course_name').optional().isLength({ max: 255 }).withMessage('Course name must be less than 255 characters'),
    (0, express_validator_1.body)('description').optional().isString(),
    (0, express_validator_1.body)('duration_months').optional().isInt({ min: 1, max: 60 }).withMessage('Duration must be between 1 and 60 months')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map((err) => ({
            field: err.param,
            message: err.msg
        })));
    }
    const { id } = req.params;
    const { course_name, description, duration_months } = req.body;
    // Get current course data
    const currentResult = await (0, connection_1.query)('SELECT * FROM courses WHERE course_id = $1', [id]);
    if (currentResult.rows.length === 0) {
        throw (0, errorHandler_1.createError)('Course not found', 404);
    }
    const currentCourse = currentResult.rows[0];
    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;
    if (course_name !== undefined) {
        updates.push(`course_name = $${paramIndex++}`);
        values.push(course_name);
    }
    if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description);
    }
    if (duration_months !== undefined) {
        updates.push(`duration_months = $${paramIndex++}`);
        values.push(duration_months);
    }
    if (updates.length === 0) {
        throw (0, errorHandler_1.createError)('No fields to update', 400);
    }
    updates.push(`updated_at = NOW()`);
    values.push(id);
    const updateQuery = `
      UPDATE courses 
      SET ${updates.join(', ')}
      WHERE course_id = $${paramIndex}
      RETURNING *
    `;
    const result = await (0, connection_1.query)(updateQuery, values);
    const updatedCourse = result.rows[0];
    // Log the action
    await (0, connection_1.query)(`
      INSERT INTO audit_logs (
        admin_id, action, table_name, record_id, 
        old_values, new_values, ip_address, user_agent
      ) VALUES ($1, 'UPDATE', 'courses', $2, $3, $4, $5, $6)
    `, [
        req.admin.adminId,
        id,
        JSON.stringify(currentCourse),
        JSON.stringify(updatedCourse),
        req.ip,
        req.get('User-Agent')
    ]);
    logger_1.logger.info('Course updated successfully:', {
        courseId: id,
        updatedBy: req.admin.adminId
    });
    res.json({
        success: true,
        message: 'Course updated successfully',
        data: updatedCourse
    });
}));
/**
 * @swagger
 * /courses/{id}/deactivate:
 *   patch:
 *     summary: Deactivate course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Course deactivated successfully
 *       404:
 *         description: Course not found
 */
router.patch('/:id/deactivate', (0, auth_1.authorizeRoles)('super_admin', 'admin'), [
    (0, express_validator_1.param)('id').isUUID().withMessage('Valid course ID is required')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map((err) => ({
            field: err.param,
            message: err.msg
        })));
    }
    const { id } = req.params;
    const result = await (0, connection_1.query)(`
      UPDATE courses 
      SET is_active = false, updated_at = NOW()
      WHERE course_id = $1 AND is_active = true
      RETURNING *
    `, [id]);
    if (result.rows.length === 0) {
        throw (0, errorHandler_1.createError)('Course not found or already deactivated', 404);
    }
    // Log the action
    await (0, connection_1.query)(`
      INSERT INTO audit_logs (
        admin_id, action, table_name, record_id, 
        old_values, new_values, ip_address, user_agent
      ) VALUES ($1, 'UPDATE', 'courses', $2, $3, $4, $5, $6)
    `, [
        req.admin.adminId,
        id,
        JSON.stringify({ is_active: true }),
        JSON.stringify({ is_active: false }),
        req.ip,
        req.get('User-Agent')
    ]);
    logger_1.logger.info('Course deactivated:', {
        courseId: id,
        deactivatedBy: req.admin.adminId
    });
    res.json({
        success: true,
        message: 'Course deactivated successfully',
        data: result.rows[0]
    });
}));
exports.default = router;
