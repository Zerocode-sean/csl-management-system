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
// All student routes require authentication
router.use(auth_1.authenticateToken);
/**
 * @swagger
 * /students:
 *   get:
 *     summary: Get students with pagination and search
 *     tags: [Students]
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
 *         description: List of students
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
        whereConditions.push(`s.is_active = $${paramIndex++}`);
        queryParams.push(activeFilter);
    }
    // Search filter
    if (search) {
        whereConditions.push(`(
        s.name ILIKE $${paramIndex} OR 
        s.email ILIKE $${paramIndex} OR 
        s.national_id ILIKE $${paramIndex}
      )`);
        queryParams.push(`%${search}%`);
        paramIndex++;
    }
    const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';
    // Get students
    const studentsQuery = `
      SELECT 
        s.*,
        COUNT(c.certificate_id) as certificate_count,
        COUNT(c.certificate_id) FILTER (WHERE c.status = 'active') as active_certificates
      FROM students s
      LEFT JOIN certificates c ON s.student_id = c.student_id
      ${whereClause}
      GROUP BY s.student_id
      ORDER BY s.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;
    queryParams.push(limit, offset);
    const studentsResult = await (0, connection_1.query)(studentsQuery, queryParams);
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM students s
      ${whereClause}
    `;
    const countResult = await (0, connection_1.query)(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);
    res.json({
        success: true,
        data: {
            students: studentsResult.rows,
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
 * /students/{id}:
 *   get:
 *     summary: Get student by ID
 *     tags: [Students]
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
 *         description: Student details
 *       404:
 *         description: Student not found
 */
router.get('/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Valid student ID is required')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map((err) => ({
            field: err.param,
            message: err.msg
        })));
    }
    const { id } = req.params;
    const studentResult = await (0, connection_1.query)(`
      SELECT 
        s.*,
        COUNT(c.certificate_id) as certificate_count,
        COUNT(c.certificate_id) FILTER (WHERE c.status = 'active') as active_certificates
      FROM students s
      LEFT JOIN certificates c ON s.student_id = c.student_id
      WHERE s.student_id = $1
      GROUP BY s.student_id
    `, [id]);
    if (studentResult.rows.length === 0) {
        throw (0, errorHandler_1.createError)('Student not found', 404);
    }
    // Get student's certificates
    const certificatesResult = await (0, connection_1.query)(`
      SELECT 
        c.certificate_id,
        c.csl_number,
        c.status,
        c.issued_at,
        c.revoked_at,
        course.course_name,
        course.course_code
      FROM certificates c
      JOIN courses course ON c.course_id = course.course_id
      WHERE c.student_id = $1
      ORDER BY c.issued_at DESC
    `, [id]);
    const student = studentResult.rows[0];
    student.certificates = certificatesResult.rows;
    res.json({
        success: true,
        data: student
    });
}));
/**
 * @swagger
 * /students:
 *   post:
 *     summary: Create a new student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - national_id
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *                 maxLength: 20
 *               address:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               national_id:
 *                 type: string
 *                 maxLength: 50
 *     responses:
 *       201:
 *         description: Student created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email or National ID already exists
 */
router.post('/', (0, auth_1.authorizeRoles)('super_admin', 'admin', 'course_manager'), [
    (0, express_validator_1.body)('name').notEmpty().isLength({ max: 255 }).withMessage('Name is required and must be less than 255 characters'),
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('phone').notEmpty().isLength({ max: 20 }).withMessage('Phone is required and must be less than 20 characters'),
    (0, express_validator_1.body)('address').optional().isString(),
    (0, express_validator_1.body)('date_of_birth').optional().isDate().withMessage('Date of birth must be a valid date'),
    (0, express_validator_1.body)('national_id').notEmpty().isLength({ max: 50 }).withMessage('National ID is required and must be less than 50 characters')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map((err) => ({
            field: err.param,
            message: err.msg
        })));
    }
    const { name, email, phone, address, date_of_birth, national_id } = req.body;
    // Check if email or national_id already exists
    const existingResult = await (0, connection_1.query)('SELECT student_id, email, national_id FROM students WHERE email = $1 OR national_id = $2', [email, national_id]);
    if (existingResult.rows.length > 0) {
        const existing = existingResult.rows[0];
        if (existing.email === email) {
            throw (0, errorHandler_1.createError)('Email already exists', 409);
        }
        if (existing.national_id === national_id) {
            throw (0, errorHandler_1.createError)('National ID already exists', 409);
        }
    }
    const studentId = (0, uuid_1.v4)();
    const result = await (0, connection_1.query)(`
      INSERT INTO students (
        student_id, name, email, phone, address, date_of_birth, national_id, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING *
    `, [studentId, name, email, phone, address, date_of_birth, national_id]);
    const student = result.rows[0];
    // Log the action
    await (0, connection_1.query)(`
      INSERT INTO audit_logs (
        admin_id, action, table_name, record_id, 
        new_values, ip_address, user_agent
      ) VALUES ($1, 'CREATE', 'students', $2, $3, $4, $5)
    `, [
        req.admin.adminId,
        studentId,
        JSON.stringify(student),
        req.ip,
        req.get('User-Agent')
    ]);
    logger_1.logger.info('Student created successfully:', {
        studentId,
        email,
        createdBy: req.admin.adminId
    });
    res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: student
    });
}));
/**
 * @swagger
 * /students/{id}:
 *   put:
 *     summary: Update student
 *     tags: [Students]
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
 *               name:
 *                 type: string
 *                 maxLength: 255
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *                 maxLength: 20
 *               address:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               national_id:
 *                 type: string
 *                 maxLength: 50
 *     responses:
 *       200:
 *         description: Student updated successfully
 *       404:
 *         description: Student not found
 */
router.put('/:id', (0, auth_1.authorizeRoles)('super_admin', 'admin', 'course_manager'), [
    (0, express_validator_1.param)('id').isUUID().withMessage('Valid student ID is required'),
    (0, express_validator_1.body)('name').optional().isLength({ max: 255 }).withMessage('Name must be less than 255 characters'),
    (0, express_validator_1.body)('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('phone').optional().isLength({ max: 20 }).withMessage('Phone must be less than 20 characters'),
    (0, express_validator_1.body)('address').optional().isString(),
    (0, express_validator_1.body)('date_of_birth').optional().isDate().withMessage('Date of birth must be a valid date'),
    (0, express_validator_1.body)('national_id').optional().isLength({ max: 50 }).withMessage('National ID must be less than 50 characters')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map((err) => ({
            field: err.param,
            message: err.msg
        })));
    }
    const { id } = req.params;
    const { name, email, phone, address, date_of_birth, national_id } = req.body;
    // Get current student data
    const currentResult = await (0, connection_1.query)('SELECT * FROM students WHERE student_id = $1', [id]);
    if (currentResult.rows.length === 0) {
        throw (0, errorHandler_1.createError)('Student not found', 404);
    }
    const currentStudent = currentResult.rows[0];
    // Check for conflicts if email or national_id is being changed
    if (email && email !== currentStudent.email) {
        const emailCheck = await (0, connection_1.query)('SELECT student_id FROM students WHERE email = $1 AND student_id != $2', [email, id]);
        if (emailCheck.rows.length > 0) {
            throw (0, errorHandler_1.createError)('Email already exists', 409);
        }
    }
    if (national_id && national_id !== currentStudent.national_id) {
        const nationalIdCheck = await (0, connection_1.query)('SELECT student_id FROM students WHERE national_id = $1 AND student_id != $2', [national_id, id]);
        if (nationalIdCheck.rows.length > 0) {
            throw (0, errorHandler_1.createError)('National ID already exists', 409);
        }
    }
    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;
    if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
    }
    if (email !== undefined) {
        updates.push(`email = $${paramIndex++}`);
        values.push(email);
    }
    if (phone !== undefined) {
        updates.push(`phone = $${paramIndex++}`);
        values.push(phone);
    }
    if (address !== undefined) {
        updates.push(`address = $${paramIndex++}`);
        values.push(address);
    }
    if (date_of_birth !== undefined) {
        updates.push(`date_of_birth = $${paramIndex++}`);
        values.push(date_of_birth);
    }
    if (national_id !== undefined) {
        updates.push(`national_id = $${paramIndex++}`);
        values.push(national_id);
    }
    if (updates.length === 0) {
        throw (0, errorHandler_1.createError)('No fields to update', 400);
    }
    updates.push(`updated_at = NOW()`);
    values.push(id);
    const updateQuery = `
      UPDATE students 
      SET ${updates.join(', ')}
      WHERE student_id = $${paramIndex}
      RETURNING *
    `;
    const result = await (0, connection_1.query)(updateQuery, values);
    const updatedStudent = result.rows[0];
    // Log the action
    await (0, connection_1.query)(`
      INSERT INTO audit_logs (
        admin_id, action, table_name, record_id, 
        old_values, new_values, ip_address, user_agent
      ) VALUES ($1, 'UPDATE', 'students', $2, $3, $4, $5, $6)
    `, [
        req.admin.adminId,
        id,
        JSON.stringify(currentStudent),
        JSON.stringify(updatedStudent),
        req.ip,
        req.get('User-Agent')
    ]);
    logger_1.logger.info('Student updated successfully:', {
        studentId: id,
        updatedBy: req.admin.adminId
    });
    res.json({
        success: true,
        message: 'Student updated successfully',
        data: updatedStudent
    });
}));
/**
 * @swagger
 * /students/{id}/deactivate:
 *   patch:
 *     summary: Deactivate student
 *     tags: [Students]
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
 *         description: Student deactivated successfully
 *       404:
 *         description: Student not found
 */
router.patch('/:id/deactivate', (0, auth_1.authorizeRoles)('super_admin', 'admin'), [
    (0, express_validator_1.param)('id').isUUID().withMessage('Valid student ID is required')
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
      UPDATE students 
      SET is_active = false, updated_at = NOW()
      WHERE student_id = $1 AND is_active = true
      RETURNING *
    `, [id]);
    if (result.rows.length === 0) {
        throw (0, errorHandler_1.createError)('Student not found or already deactivated', 404);
    }
    // Log the action
    await (0, connection_1.query)(`
      INSERT INTO audit_logs (
        admin_id, action, table_name, record_id, 
        old_values, new_values, ip_address, user_agent
      ) VALUES ($1, 'UPDATE', 'students', $2, $3, $4, $5, $6)
    `, [
        req.admin.adminId,
        id,
        JSON.stringify({ is_active: true }),
        JSON.stringify({ is_active: false }),
        req.ip,
        req.get('User-Agent')
    ]);
    logger_1.logger.info('Student deactivated:', {
        studentId: id,
        deactivatedBy: req.admin.adminId
    });
    res.json({
        success: true,
        message: 'Student deactivated successfully',
        data: result.rows[0]
    });
}));
exports.default = router;
