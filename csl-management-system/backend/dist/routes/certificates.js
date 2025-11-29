"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const certificateService_1 = require("../services/certificateService");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const express_validator_1 = require("express-validator");
const connection_1 = require("../database/connection");
const router = (0, express_1.Router)();
// All certificate routes require authentication
router.use(auth_1.authenticateToken);
/**
 * @swagger
 * /certificates:
 *   get:
 *     summary: Get certificates with pagination and filters
 *     tags: [Certificates]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, revoked, suspended]
 *       - in: query
 *         name: course_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of certificates
 */
router.get('/', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('status').optional().isIn(['active', 'revoked', 'suspended']),
    (0, express_validator_1.query)('course_id').optional().isUUID(),
    (0, express_validator_1.query)('student_id').optional().isUUID(),
    (0, express_validator_1.query)('search').optional().isString().trim()
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map((err) => ({
            field: err.param,
            message: err.msg
        })));
    }
    const result = await certificateService_1.CertificateService.getCertificates({
        page: req.query.page || 1,
        limit: req.query.limit || 10,
        status: req.query.status,
        courseId: req.query.course_id,
        studentId: req.query.student_id,
        search: req.query.search
    });
    res.json({
        success: true,
        data: result
    });
}));
/**
 * @swagger
 * /certificates/{id}:
 *   get:
 *     summary: Get certificate by ID
 *     tags: [Certificates]
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
 *         description: Certificate details
 *       404:
 *         description: Certificate not found
 */
router.get('/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Valid certificate ID is required')
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
      SELECT 
        c.*,
        s.name as student_name,
        s.email as student_email,
        s.phone as student_phone,
        course.course_name,
        course.course_code,
        course.duration_months,
        issuer.name as issuer_name,
        revoker.name as revoker_name
      FROM certificates c
      JOIN students s ON c.student_id = s.student_id
      JOIN courses course ON c.course_id = course.course_id
      JOIN admins issuer ON c.issued_by = issuer.admin_id
      LEFT JOIN admins revoker ON c.revoked_by = revoker.admin_id
      WHERE c.certificate_id = $1
    `, [id]);
    if (result.rows.length === 0) {
        throw (0, errorHandler_1.createError)('Certificate not found', 404);
    }
    res.json({
        success: true,
        data: result.rows[0]
    });
}));
/**
 * @swagger
 * /certificates/issue:
 *   post:
 *     summary: Issue a new certificate
 *     tags: [Certificates]
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
 *               - course_id
 *             properties:
 *               student_id:
 *                 type: string
 *                 format: uuid
 *               course_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Certificate issued successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Certificate already exists
 */
router.post('/issue', (0, auth_1.authorizeRoles)('super_admin', 'admin', 'course_manager'), [
    (0, express_validator_1.body)('student_id').isUUID().withMessage('Valid student ID is required'),
    (0, express_validator_1.body)('course_id').isUUID().withMessage('Valid course ID is required')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map((err) => ({
            field: err.param,
            message: err.msg
        })));
    }
    const { student_id, course_id } = req.body;
    const issued_by = req.admin.adminId;
    // Verify student exists and is active
    const studentResult = await (0, connection_1.query)('SELECT student_id, name, email FROM students WHERE student_id = $1 AND is_active = true', [student_id]);
    if (studentResult.rows.length === 0) {
        throw (0, errorHandler_1.createError)('Student not found or inactive', 404);
    }
    // Verify course exists and is active
    const courseResult = await (0, connection_1.query)('SELECT course_id, course_name, course_code FROM courses WHERE course_id = $1 AND is_active = true', [course_id]);
    if (courseResult.rows.length === 0) {
        throw (0, errorHandler_1.createError)('Course not found or inactive', 404);
    }
    const certificate = await certificateService_1.CertificateService.issueCertificate({
        student_id,
        course_id,
        issued_by
    });
    // Log the action in audit logs
    await (0, connection_1.query)(`
      INSERT INTO audit_logs (
        admin_id, action, table_name, record_id, 
        new_values, ip_address, user_agent
      ) VALUES ($1, 'CREATE', 'certificates', $2, $3, $4, $5)
    `, [
        issued_by,
        certificate.certificate_id,
        JSON.stringify({
            csl_number: certificate.csl_number,
            student_id: certificate.student_id,
            course_id: certificate.course_id
        }),
        req.ip,
        req.get('User-Agent')
    ]);
    res.status(201).json({
        success: true,
        message: 'Certificate issued successfully',
        data: {
            certificate_id: certificate.certificate_id,
            csl_number: certificate.csl_number,
            student: studentResult.rows[0],
            course: courseResult.rows[0],
            issued_at: certificate.issued_at
        }
    });
}));
/**
 * @swagger
 * /certificates/{id}/revoke:
 *   patch:
 *     summary: Revoke a certificate
 *     tags: [Certificates]
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
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Student violated terms and conditions"
 *     responses:
 *       200:
 *         description: Certificate revoked successfully
 *       404:
 *         description: Certificate not found
 */
router.patch('/:id/revoke', (0, auth_1.authorizeRoles)('super_admin', 'admin'), [
    (0, express_validator_1.param)('id').isUUID().withMessage('Valid certificate ID is required'),
    (0, express_validator_1.body)('reason').optional().isString().isLength({ max: 500 }).withMessage('Reason must be a string with maximum 500 characters')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map((err) => ({
            field: err.param,
            message: err.msg
        })));
    }
    const { id } = req.params;
    const { reason } = req.body;
    const revoked_by = req.admin.adminId;
    // Get certificate details before revoking
    const beforeResult = await (0, connection_1.query)('SELECT * FROM certificates WHERE certificate_id = $1', [id]);
    if (beforeResult.rows.length === 0) {
        throw (0, errorHandler_1.createError)('Certificate not found', 404);
    }
    const certificate = await certificateService_1.CertificateService.revokeCertificate(id, revoked_by, reason);
    // Log the action in audit logs
    await (0, connection_1.query)(`
      INSERT INTO audit_logs (
        admin_id, action, table_name, record_id, 
        old_values, new_values, ip_address, user_agent
      ) VALUES ($1, 'UPDATE', 'certificates', $2, $3, $4, $5, $6)
    `, [
        revoked_by,
        id,
        JSON.stringify({ status: 'active' }),
        JSON.stringify({
            status: 'revoked',
            revoked_by,
            revocation_reason: reason
        }),
        req.ip,
        req.get('User-Agent')
    ]);
    res.json({
        success: true,
        message: 'Certificate revoked successfully',
        data: certificate
    });
}));
/**
 * @swagger
 * /certificates/stats:
 *   get:
 *     summary: Get certificate statistics
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Certificate statistics
 */
router.get('/stats', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const statsResult = await (0, connection_1.query)(`
    SELECT 
      COUNT(*) as total_certificates,
      COUNT(*) FILTER (WHERE status = 'active') as active_certificates,
      COUNT(*) FILTER (WHERE status = 'revoked') as revoked_certificates,
      COUNT(*) FILTER (WHERE status = 'suspended') as suspended_certificates,
      COUNT(*) FILTER (WHERE DATE(issued_at) = CURRENT_DATE) as issued_today,
      COUNT(*) FILTER (WHERE DATE(issued_at) >= CURRENT_DATE - INTERVAL '30 days') as issued_last_30_days
    FROM certificates
  `);
    const courseStatsResult = await (0, connection_1.query)(`
    SELECT 
      co.course_name,
      co.course_code,
      COUNT(c.certificate_id) as certificate_count
    FROM courses co
    LEFT JOIN certificates c ON co.course_id = c.course_id AND c.status = 'active'
    GROUP BY co.course_id, co.course_name, co.course_code
    ORDER BY certificate_count DESC
  `);
    const stats = statsResult.rows[0];
    const courseStats = courseStatsResult.rows;
    res.json({
        success: true,
        data: {
            overview: {
                total_certificates: parseInt(stats.total_certificates),
                active_certificates: parseInt(stats.active_certificates),
                revoked_certificates: parseInt(stats.revoked_certificates),
                suspended_certificates: parseInt(stats.suspended_certificates),
                issued_today: parseInt(stats.issued_today),
                issued_last_30_days: parseInt(stats.issued_last_30_days)
            },
            by_course: courseStats
        }
    });
}));
exports.default = router;
