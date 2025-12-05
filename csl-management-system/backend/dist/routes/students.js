"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const express_validator_1 = require("express-validator");
const connection_1 = require("../database/connection");
const logger_1 = require("../utils/logger");
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
    const page = parseInt(req.query['page'], 10) || 1;
    const limit = parseInt(req.query['limit'], 10) || 10;
    const search = req.query['search'];
    const activeFilter = req.query['active'] === 'true' ? true : req.query['active'] === 'false' ? false : undefined;
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
        s.student_id,
        s.student_custom_id,
        s.name,
        s.email,
        s.mobile,
        s.address,
        s.date_of_birth,
        s.status,
        s.profile_picture,
        s.institution,
        s.grade,
        s.created_at,
        s.updated_at,
        s.deleted_at,
        COUNT(DISTINCT cert.csl_number) as certificate_count,
        COUNT(DISTINCT cert.csl_number) FILTER (WHERE cert.status = 'active') as active_certificates,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', course.course_id,
              'code', course.code,
              'title', course.title,
              'isActive', course.is_active
            )
          ) FILTER (WHERE course.course_id IS NOT NULL),
          '[]'
        ) as courses
      FROM students s
      LEFT JOIN certificates cert ON s.student_id = cert.student_id
      LEFT JOIN student_courses sc ON s.student_id = sc.student_id AND sc.status = 'enrolled'
      LEFT JOIN courses course ON sc.course_id = course.course_id AND course.deleted_at IS NULL
      ${whereClause}
      GROUP BY s.student_id, s.student_custom_id, s.name, s.email, s.mobile, s.address, s.date_of_birth, s.status, s.profile_picture, s.institution, s.grade, s.created_at, s.updated_at, s.deleted_at
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
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('Valid student ID is required')
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
      LEFT JOIN certificates c ON s.id = c.student_id
      WHERE s.id = $1
      GROUP BY s.id
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
 *         description: Email or Student ID already exists
 */
router.post('/', (0, auth_1.authorizeRoles)('super_admin', 'admin', 'course_manager'), [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required').isLength({ max: 255 }).withMessage('Name must be less than 255 characters'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    (0, express_validator_1.body)('phone').notEmpty().withMessage('Phone is required').isLength({ max: 20 }).withMessage('Phone must be less than 20 characters'),
    (0, express_validator_1.body)('address').optional().isString().withMessage('Address must be a valid string'),
    (0, express_validator_1.body)('date_of_birth').optional().isISO8601().withMessage('Date of birth must be a valid date (YYYY-MM-DD)'),
    (0, express_validator_1.body)('student_custom_id').notEmpty().withMessage('Student ID is required').isLength({ max: 50 }).withMessage('Student ID must be less than 50 characters'),
    (0, express_validator_1.body)('course_id').optional().isInt().withMessage('Course ID must be a valid integer'),
    (0, express_validator_1.body)('profile_picture').optional().isString(),
    (0, express_validator_1.body)('institution').optional().isString().trim(),
    (0, express_validator_1.body)('grade').optional().isString().trim()
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map((err) => ({
            field: err.param,
            message: err.msg
        })));
    }
    console.log('DEBUG: students.ts POST / received body:', JSON.stringify(req.body, null, 2));
    const { name, email, phone, address, date_of_birth, student_custom_id, course_id } = req.body;
    // Handle field aliases
    const profile_picture = req.body.profile_picture;
    const institution = req.body.institution || req.body.home_institution;
    const grade = req.body.grade || req.body.current_grade;
    // Check if email or student_custom_id already exists
    const existingResult = await (0, connection_1.query)('SELECT student_id, email, student_custom_id FROM students WHERE email = $1 OR student_custom_id = $2', [email, student_custom_id]);
    if (existingResult.rows.length > 0) {
        const existing = existingResult.rows[0];
        if (existing.email === email) {
            throw (0, errorHandler_1.createError)('Email already exists', 409);
        }
        if (existing.student_custom_id === student_custom_id) {
            throw (0, errorHandler_1.createError)('Student ID already exists', 409);
        }
    }
    const { getClient } = await Promise.resolve().then(() => __importStar(require('../database/connection')));
    const client = await getClient();
    try {
        await client.query('BEGIN');
        // Create student
        const result = await client.query(`
        INSERT INTO students (
          name, email, mobile, address, date_of_birth, student_custom_id, status, profile_picture, institution, grade
        ) VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8, $9)
        RETURNING *
      `, [name, email, phone, address, date_of_birth, student_custom_id, profile_picture, institution, grade]);
        const student = result.rows[0];
        // Enroll in course if provided
        if (course_id) {
            await client.query(`
          INSERT INTO student_courses (
            student_id, course_id, status, enrollment_date
          ) VALUES ($1, $2, 'enrolled', CURRENT_DATE)
        `, [student.student_id, course_id]);
        }
        // Log the action
        await client.query(`
        INSERT INTO audit_logs (
          admin_id, action, entity_type, entity_id, 
          new_values, ip_address, user_agent
        ) VALUES ($1, 'CREATE', 'students', $2, $3, $4, $5)
      `, [
            req.admin.adminId,
            student.student_id.toString(),
            JSON.stringify(student),
            req.ip,
            req.get('User-Agent')
        ]);
        await client.query('COMMIT');
        logger_1.logger.info('Student created successfully:', {
            studentId: student.student_id,
            email,
            createdBy: req.admin.adminId
        });
        res.status(201).json({
            success: true,
            message: 'Student created successfully',
            data: student
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
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
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('Valid student ID is required'),
    (0, express_validator_1.body)('name').optional().isLength({ max: 255 }).withMessage('Name must be less than 255 characters'),
    (0, express_validator_1.body)('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('phone').optional().isLength({ max: 20 }).withMessage('Phone must be less than 20 characters'),
    (0, express_validator_1.body)('address').optional().isString().withMessage('Address must be a valid string'),
    (0, express_validator_1.body)('date_of_birth').optional().isISO8601().withMessage('Date of birth must be a valid date (YYYY-MM-DD)'),
    (0, express_validator_1.body)('date_of_birth').optional().isISO8601().withMessage('Date of birth must be a valid date (YYYY-MM-DD)'),
    (0, express_validator_1.body)('national_id').optional().isLength({ max: 50 }).withMessage('National ID must be less than 50 characters'),
    (0, express_validator_1.body)('profile_picture').optional().isString(),
    (0, express_validator_1.body)('institution').optional().isString().trim(),
    (0, express_validator_1.body)('grade').optional().isString().trim()
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map((err) => ({
            field: err.param,
            message: err.msg
        })));
    }
    const { id } = req.params;
    console.log('DEBUG: students.ts PUT /:id received body:', JSON.stringify(req.body, null, 2));
    const { name, email, phone, address, date_of_birth, national_id } = req.body;
    // Handle field aliases
    const profile_picture = req.body.profile_picture || req.body.profilePicture;
    const institution = req.body.institution || req.body.home_institution;
    const grade = req.body.grade || req.body.current_grade;
    // Get current student data
    const currentResult = await (0, connection_1.query)('SELECT * FROM students WHERE id = $1', [id]);
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
    if (profile_picture !== undefined) {
        updates.push(`profile_picture = $${paramIndex++}`);
        values.push(profile_picture);
    }
    if (institution !== undefined) {
        updates.push(`institution = $${paramIndex++}`);
        values.push(institution);
    }
    if (grade !== undefined) {
        updates.push(`grade = $${paramIndex++}`);
        values.push(grade);
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
        admin_id, action, entity_type, entity_id, 
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
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('Valid student ID is required')
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
      WHERE id = $1 AND is_active = true
      RETURNING *
    `, [id]);
    if (result.rows.length === 0) {
        throw (0, errorHandler_1.createError)('Student not found or already deactivated', 404);
    }
    // Log the action
    await (0, connection_1.query)(`
      INSERT INTO audit_logs (
        admin_id, action, entity_type, entity_id, 
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
/**
 * @swagger
 * /students/{id}:
 *   delete:
 *     summary: Delete student (soft delete)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Student deleted successfully
 *       404:
 *         description: Student not found
 */
router.delete('/:id', (0, auth_1.authorizeRoles)('super_admin', 'admin'), [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('Valid student ID is required')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map((err) => ({
            field: err.param,
            message: err.msg
        })));
    }
    const { id } = req.params;
    // Get current student data before deletion
    const currentResult = await (0, connection_1.query)('SELECT * FROM students WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (currentResult.rows.length === 0) {
        throw (0, errorHandler_1.createError)('Student not found or already deleted', 404);
    }
    // Soft delete: set deleted_at timestamp
    const result = await (0, connection_1.query)(`
      UPDATE students 
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `, [id]);
    // Log the action
    await (0, connection_1.query)(`
      INSERT INTO audit_logs (
        admin_id, action, entity_type, entity_id, 
        old_values, ip_address, user_agent
      ) VALUES ($1, 'DELETE', 'students', $2, $3, $4, $5)
    `, [
        req.admin.adminId,
        id,
        JSON.stringify(currentResult.rows[0]),
        req.ip,
        req.get('User-Agent')
    ]);
    logger_1.logger.info('Student deleted:', {
        studentId: id,
        deletedBy: req.admin.adminId
    });
    res.json({
        success: true,
        message: 'Student deleted successfully',
        data: result.rows[0]
    });
}));
exports.default = router;
