"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const express_validator_1 = require("express-validator");
const StudentRepository_1 = require("../repositories/StudentRepository");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const studentRepo = new StudentRepository_1.StudentRepository();
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
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, student ID, or email
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, graduated, suspended, withdrawn]
 *       - in: query
 *         name: enrollment_year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: created_at
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: List of students
 */
router.get('/', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('search').optional().isString().trim(),
    (0, express_validator_1.query)('status').optional().isIn(['active', 'graduated', 'suspended', 'withdrawn']),
    (0, express_validator_1.query)('enrollment_year').optional().isInt().toInt(),
    (0, express_validator_1.query)('sort_by').optional().isString(),
    (0, express_validator_1.query)('sort_order').optional().isIn(['ASC', 'DESC'])
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    const filters = {
        search: req.query['search'],
        status: req.query['status'],
        enrollment_year: parseInt(req.query['enrollment_year'], 10)
    };
    const pagination = {
        page: parseInt(req.query['page'], 10) || 1,
        limit: parseInt(req.query['limit'], 10) || 20,
        sort_by: req.query['sort_by'] || 'created_at',
        sort_order: req.query['sort_order'] || 'DESC'
    };
    const result = await studentRepo.search(filters, pagination);
    return res.json({
        success: true,
        message: 'Students retrieved successfully',
        data: result.data,
        pagination: result.pagination
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
 *           type: integer
 *     responses:
 *       200:
 *         description: Student details
 *       404:
 *         description: Student not found
 */
router.get('/:id', [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).toInt()
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Invalid student ID',
            errors: errors.array()
        });
    }
    const studentId = parseInt(req.params['id'], 10);
    if (isNaN(studentId) || studentId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid student ID format'
        });
    }
    const student = await studentRepo.findById(studentId);
    if (!student) {
        return res.status(404).json({
            success: false,
            message: 'Student not found'
        });
    }
    return res.json({
        success: true,
        message: 'Student retrieved successfully',
        data: student
    });
}));
/**
 * @swagger
 * /students:
 *   post:
 *     summary: Create new student
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
 *               - student_id
 *               - first_name
 *               - last_name
 *               - email
 *             properties:
 *               student_id:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               address:
 *                 type: string
 *               enrollment_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Student created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Student ID or email already exists
 */
router.post('/', (0, auth_1.authorizeRoles)('admin', 'instructor'), [
    (0, express_validator_1.body)('student_id').notEmpty().isString().trim().withMessage('student_id is required'),
    (0, express_validator_1.body)('first_name').notEmpty().isString().trim().isLength({ min: 2, max: 50 }).withMessage('first_name is required and must be 2-50 chars'),
    (0, express_validator_1.body)('last_name').notEmpty().isString().trim().isLength({ min: 2, max: 50 }).withMessage('last_name is required and must be 2-50 chars'),
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('email must be valid'),
    (0, express_validator_1.body)('mobile').optional().isMobilePhone('any'),
    (0, express_validator_1.body)('address').optional().isString().trim().isLength({ max: 500 }),
    (0, express_validator_1.body)('date_of_birth').optional().isISO8601().toDate(),
    (0, express_validator_1.body)('status').optional().isString().trim(),
    (0, express_validator_1.body)('profile_picture').optional().isString().trim(),
    (0, express_validator_1.body)('grade').optional().isString().trim().isLength({ max: 50 }),
    (0, express_validator_1.body)('institution').optional().isString().trim().isLength({ max: 100 }),
    (0, express_validator_1.body)('course_id').optional().isInt().toInt().withMessage('course_id must be an integer')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        // Debug: log raw validation errors for troubleshooting
        logger_1.logger.info('DEBUG validation errors', { errors: errors.array() });
        logger_1.logger.error('Raw validation errors', { errors: errors.array() });
        // Map errors to include param (field name) and message only, fallback to param/unknown
        const errorDetails = errors.array().map(e => ({
            field: e.param || 'unknown',
            message: e.msg || 'Invalid value'
        }));
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errorDetails
        });
    }
    // Check if student ID already exists
    const existingStudentId = await studentRepo.existsByStudentId(req.body.student_id);
    if (existingStudentId) {
        return res.status(409).json({
            success: false,
            message: 'Student ID already exists'
        });
    }
    // Check if email already exists
    const existingEmail = await studentRepo.existsByEmail(req.body.email);
    if (existingEmail) {
        return res.status(409).json({
            success: false,
            message: 'Email already exists'
        });
    }
    // Debug logging
    console.log('DEBUG: Received create student request body:', JSON.stringify(req.body, null, 2));
    // Map frontend fields to backend DTO
    const studentData = {
        student_id: req.body.student_custom_id || req.body.student_id,
        first_name: req.body.name ? req.body.name.split(' ')[0] : '',
        last_name: req.body.name ? req.body.name.split(' ').slice(1).join(' ') || req.body.name.split(' ')[0] : '',
        email: req.body.email,
        phone: req.body.phone || req.body.mobile || null,
        address: req.body.address || null,
        date_of_birth: req.body.date_of_birth || null,
        status: req.body.status || null,
        profile_picture: req.body.profile_picture || null,
        grade: req.body.current_grade || req.body.grade || null,
        institution: req.body.home_institution || req.body.institution || null,
        course_id: req.body.course_id || null
    };
    console.log('DEBUG: Mapped studentData for repository:', JSON.stringify(studentData, null, 2));
    const student = await studentRepo.create(studentData);
    logger_1.logger.info('Student created', {
        student_id: student.student_id,
        created_by: req.admin?.adminId
    });
    return res.status(201).json({
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
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, graduated, suspended, withdrawn]
 *     responses:
 *       200:
 *         description: Student updated successfully
 *       404:
 *         description: Student not found
 */
router.put('/:id', (0, auth_1.authorizeRoles)('admin', 'instructor'), [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).toInt(),
    (0, express_validator_1.body)('first_name').optional().isString().trim().isLength({ min: 2, max: 50 }),
    (0, express_validator_1.body)('last_name').optional().isString().trim().isLength({ min: 2, max: 50 }),
    (0, express_validator_1.body)('name').optional().isString().trim().isLength({ min: 2, max: 100 }),
    (0, express_validator_1.body)('email').optional().isEmail().normalizeEmail(),
    (0, express_validator_1.body)('phone').optional().isMobilePhone('any'),
    (0, express_validator_1.body)('address').optional().isString().trim().isLength({ max: 500 }),
    (0, express_validator_1.body)('status').optional().isIn(['active', 'graduated', 'suspended', 'withdrawn']),
    (0, express_validator_1.body)('profilePicture').optional().isString(),
    (0, express_validator_1.body)('profile_picture').optional().isString(),
    (0, express_validator_1.body)('institution').optional().isString().trim(),
    (0, express_validator_1.body)('grade').optional().isString().trim()
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    const studentId = parseInt(req.params['id'], 10);
    // Check if email already exists (excluding current student)
    if (req.body.email) {
        const existingEmail = await studentRepo.existsByEmail(req.body.email, studentId);
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: 'Email already exists'
            });
        }
    }
    const updateData = {};
    if (req.body.first_name)
        updateData.first_name = req.body.first_name;
    if (req.body.last_name)
        updateData.last_name = req.body.last_name;
    // Handle 'name' field from frontend
    if (req.body.name) {
        updateData.first_name = req.body.name.split(' ')[0];
        updateData.last_name = req.body.name.split(' ').slice(1).join(' ') || req.body.name.split(' ')[0];
    }
    if (req.body.email)
        updateData.email = req.body.email;
    if (req.body.phone)
        updateData.phone = req.body.phone;
    if (req.body.address)
        updateData.address = req.body.address;
    if (req.body.status)
        updateData.status = req.body.status;
    // Handle new fields
    if (req.body.profile_picture)
        updateData.profile_picture = req.body.profile_picture;
    if (req.body.profilePicture)
        updateData.profile_picture = req.body.profilePicture;
    if (req.body.institution)
        updateData.institution = req.body.institution;
    if (req.body.grade)
        updateData.grade = req.body.grade;
    try {
        const student = await studentRepo.update(studentId, updateData);
        logger_1.logger.info('Student updated', {
            student_id: studentId,
            updated_by: req.admin?.adminId
        });
        return res.json({
            success: true,
            message: 'Student updated successfully',
            data: student
        });
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Student not found') {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        throw error;
    }
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
router.delete('/:id', (0, auth_1.authorizeRoles)('admin'), [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).toInt()
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Invalid student ID',
            errors: errors.array()
        });
    }
    const studentId = parseInt(req.params['id'], 10);
    try {
        await studentRepo.delete(studentId);
        logger_1.logger.info('Student deleted', {
            student_id: studentId,
            deleted_by: req.admin?.adminId
        });
        return res.json({
            success: true,
            message: 'Student deleted successfully'
        });
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Student not found') {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        throw error;
    }
}));
/**
 * @swagger
 * /students/{id}/certificates:
 *   get:
 *     summary: Get certificates for a student
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
 *         description: Student certificates
 *       404:
 *         description: Student not found
 */
router.get('/:id/certificates', [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).toInt()
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Invalid student ID',
            errors: errors.array()
        });
    }
    const studentId = parseInt(req.params['id'], 10);
    const student = await studentRepo.findById(studentId);
    if (!student) {
        return res.status(404).json({
            success: false,
            message: 'Student not found'
        });
    }
    // This would use CertificateRepository in a full implementation
    // For now, return empty array as placeholder
    return res.json({
        success: true,
        message: 'Student certificates retrieved successfully',
        data: []
    });
}));
exports.default = router;
