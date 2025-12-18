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
const certificateService_1 = require("../services/certificateService");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const express_validator_1 = require("express-validator");
const connection_1 = require("../database/connection");
const logger_1 = require("../utils/logger");
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
        page: parseInt(req.query['page'], 10) || 1,
        limit: parseInt(req.query['limit'], 10) || 10,
        status: req.query['status'],
        courseId: req.query['course_id'],
        studentId: req.query['student_id'],
        search: req.query['search']
    });
    res.json({
        success: true,
        data: result
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
      COUNT(*) FILTER (WHERE issue_date = CURRENT_DATE) as issued_today,
      COUNT(*) FILTER (WHERE issue_date >= CURRENT_DATE - INTERVAL '30 days') as issued_last_30_days
    FROM certificates
  `);
    const courseStatsResult = await (0, connection_1.query)(`
    SELECT
      co.title as course_name,
      co.code as course_code,
      COUNT(c.csl_number) as certificate_count
    FROM courses co
    LEFT JOIN certificates c ON co.course_id = c.course_id AND c.status = 'active'
    GROUP BY co.course_id, co.title, co.code
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
/**
 * @swagger
 * /certificates/csl/{cslNumber}:
 *   get:
 *     summary: Get certificate by CSL number
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cslNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Certificate details
 *       404:
 *         description: Certificate not found
 */
router.get('/csl/:cslNumber', [
    (0, express_validator_1.param)('cslNumber').isString().trim().notEmpty().withMessage('Valid CSL number is required')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map((err) => ({
            field: err.param,
            message: err.msg
        })));
    }
    const { cslNumber } = req.params;
    const result = await (0, connection_1.query)(`
      SELECT 
        c.*,
        s.name as student_name,
        s.email as student_email,
        s.mobile as student_phone,
        s.current_grade as grade,
        course.title as course_name,
        course.code as course_code,
        course.duration_months,
        CONCAT(issuer.first_name, ' ', issuer.last_name) as issuer_name,
        CONCAT(revoker.first_name, ' ', revoker.last_name) as revoker_name
      FROM certificates c
      JOIN students s ON c.student_id = s.student_id
      JOIN courses course ON c.course_id = course.course_id
      JOIN admins issuer ON c.issued_by_admin_id = issuer.admin_id
      LEFT JOIN admins revoker ON c.revoked_by_admin_id = revoker.admin_id
      WHERE c.csl_number = $1
    `, [cslNumber]);
    if (result.rows.length === 0) {
        throw (0, errorHandler_1.createError)('Certificate not found', 404);
    }
    res.json({
        success: true,
        data: result.rows[0]
    });
}));
/**
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
        s.mobile as student_phone,
        course.title as course_name,
        course.code as course_code,
        course.duration_months,
        issuer.first_name || ' ' || issuer.last_name as issuer_name,
        revoker.first_name || ' ' || revoker.last_name as revoker_name
      FROM certificates c
      JOIN students s ON c.student_id = s.student_id
      JOIN courses course ON c.course_id = course.course_id
      JOIN admins issuer ON c.issued_by_admin_id = issuer.admin_id
      LEFT JOIN admins revoker ON c.revoked_by_admin_id = revoker.admin_id
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
 * /certificates:
 *   post:
 *     summary: Issue a new certificate (simplified)
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
 *                 type: integer
 *               course_id:
 *                 type: integer
 *               issue_date:
 *                 type: string
 *                 format: date
 *               completion_date:
 *                 type: string
 *                 format: date
 *               grade:
 *                 type: string
 *     responses:
 *       201:
 *         description: Certificate issued successfully
 *       400:
 *         description: Validation error
 */
router.post('/', [
    (0, express_validator_1.body)('student_id').isInt().withMessage('Valid student ID is required'),
    (0, express_validator_1.body)('course_id').isInt().withMessage('Valid course ID is required'),
    (0, express_validator_1.body)('issue_date').optional().isISO8601().withMessage('Valid issue date is required')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map((err) => ({
            field: err.param,
            message: err.msg
        })));
    }
    const { student_id, course_id, issue_date } = req.body;
    const admin_id = req.admin ? parseInt(req.admin.adminId, 10) : 1;
    logger_1.logger.info('Certificate issuance requested', {
        student_id,
        course_id,
        admin_id
    });
    try {
        // Use the CertificateGeneratorService
        const { CertificateGeneratorService } = await Promise.resolve().then(() => __importStar(require('../services/certificateGenerator.service')));
        const result = await CertificateGeneratorService.generateCertificate(student_id, course_id, admin_id);
        logger_1.logger.info('Certificate issued successfully', {
            csl_number: result.cslNumber
        });
        // Update certificate with optional fields if provided
        if (issue_date) {
            await (0, connection_1.query)(`UPDATE certificates 
           SET issue_date = $1
           WHERE csl_number = $2`, [issue_date, result.cslNumber]);
        }
        // Fetch full certificate details
        const certificateResult = await (0, connection_1.query)(`SELECT c.*, 
                s.name as student_name, 
                s.email as student_email,
                s.current_grade as grade,
                co.title as course_title,
                co.code as course_code
         FROM certificates c
         JOIN students s ON c.student_id = s.student_id
         JOIN courses co ON c.course_id = co.course_id
         WHERE c.csl_number = $1`, [result.cslNumber]);
        res.status(201).json({
            success: true,
            message: 'Certificate issued successfully',
            data: {
                certificate: certificateResult.rows[0]
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error issuing certificate:', error);
        throw (0, errorHandler_1.createError)(error.message || 'Failed to issue certificate', 500);
    }
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
router.post('/generate', (0, auth_1.authorizeRoles)('super_admin', 'admin', 'course_manager'), [
    (0, express_validator_1.body)('student_id').isInt().withMessage('Valid student ID is required'),
    (0, express_validator_1.body)('course_id').isInt().withMessage('Valid course ID is required')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map((err) => ({
            field: err.param,
            message: err.msg
        })));
    }
    const { student_id, course_id } = req.body;
    const admin_id = parseInt(req.admin.adminId, 10);
    logger_1.logger.info('Certificate generation requested', {
        student_id,
        course_id,
        admin_id
    });
    // Use the new CertificateGeneratorService from cloud.md
    const { CertificateGeneratorService } = await Promise.resolve().then(() => __importStar(require('../services/certificateGenerator.service')));
    const result = await CertificateGeneratorService.generateCertificate(student_id, course_id, admin_id);
    logger_1.logger.info('Certificate generated successfully', {
        csl_number: result.cslNumber,
        pdf_path: result.pdfPath
    });
    res.status(201).json({
        success: true,
        message: 'Certificate generated successfully',
        data: {
            csl_number: result.cslNumber,
            pdf_url: `/api/v1/certificates/${result.cslNumber}/download`
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
    const id = req.params['id'];
    if (typeof id !== 'string' || !id) {
        throw (0, errorHandler_1.createError)('Missing or invalid certificate ID', 400);
    }
    if (typeof id !== 'string' || !id) {
        throw (0, errorHandler_1.createError)('Missing or invalid certificate ID', 400);
    }
    const reason = req.body.reason || 'No reason provided';
    const revoked_by = req.admin?.adminId;
    if (typeof revoked_by !== 'string' || !revoked_by) {
        throw (0, errorHandler_1.createError)('Missing or invalid admin ID for revocation', 400);
    }
    // Get certificate details before revoking
    const beforeResult = await (0, connection_1.query)('SELECT * FROM certificates WHERE certificate_id = $1', [id]);
    if (beforeResult.rows.length === 0) {
        throw (0, errorHandler_1.createError)('Certificate not found', 404);
    }
    const certificate = await certificateService_1.CertificateService.revokeCertificate(id, revoked_by, reason);
    // Log the action in audit logs
    await (0, connection_1.query)(`
      INSERT INTO audit_logs (
        admin_id, action, entity_type, entity_id, 
        old_values, new_values, ip_address, user_agent
      ) VALUES ($1, 'REVOKE', 'certificates', $2, $3, $4, $5, $6)
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
 * /certificates/csl/{cslNumber}/revoke:
 *   patch:
 *     summary: Revoke a certificate by CSL number
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cslNumber
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               revocation_reason:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Student violated terms and conditions"
 *     responses:
 *       200:
 *         description: Certificate revoked successfully
 *       404:
 *         description: Certificate not found
 */
router.patch('/csl/:cslNumber/revoke', (0, auth_1.authorizeRoles)('super_admin', 'admin'), [
    (0, express_validator_1.param)('cslNumber').isString().trim().notEmpty().withMessage('Valid CSL number is required'),
    (0, express_validator_1.body)('revocation_reason').optional().isString().isLength({ max: 500 }).withMessage('Reason must be a string with maximum 500 characters')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map((err) => ({
            field: err.param,
            message: err.msg
        })));
    }
    const { cslNumber } = req.params;
    const reason = req.body.revocation_reason || 'No reason provided';
    const revoked_by = req.admin?.adminId;
    if (!revoked_by) {
        throw (0, errorHandler_1.createError)('Missing or invalid admin ID for revocation', 400);
    }
    // Revoke the certificate directly by CSL number
    const certificate = await certificateService_1.CertificateService.revokeCertificate(cslNumber, String(revoked_by), reason);
    // Log the action in audit logs
    await (0, connection_1.query)(`
      INSERT INTO audit_logs (
        admin_id, action, entity_type, entity_id, 
        old_values, new_values, ip_address, user_agent
      ) VALUES ($1, 'REVOKE', 'certificates', $2, $3, $4, $5, $6)
    `, [
        revoked_by,
        cslNumber,
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
 * /certificates/{cslNumber}/download:
 *   get:
 *     summary: Download certificate PDF
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cslNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: CSL certificate number
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Certificate or PDF not found
 */
router.get('/:cslNumber/download', [
    (0, express_validator_1.param)('cslNumber').isString().trim().notEmpty().withMessage('Valid CSL number is required')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map((err) => ({
            field: err.param,
            message: err.msg
        })));
    }
    const { cslNumber } = req.params;
    // Verify certificate exists
    const certResult = await (0, connection_1.query)('SELECT csl_number FROM certificates WHERE csl_number = $1', [cslNumber]);
    if (certResult.rows.length === 0) {
        throw (0, errorHandler_1.createError)('Certificate not found', 404);
    }
    // Get PDF file path using CertificateService
    const pdfPath = certificateService_1.CertificateService.getCertificatePath(cslNumber);
    // Check if PDF file exists
    const fs = await Promise.resolve().then(() => __importStar(require('fs')));
    if (!fs.existsSync(pdfPath)) {
        throw (0, errorHandler_1.createError)('PDF file not found. It may need to be regenerated.', 404);
    }
    // Send PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${cslNumber}.pdf"`);
    res.sendFile(pdfPath, { root: '/' });
    logger_1.logger.info(`PDF downloaded for CSL: ${cslNumber}`, {
        admin_id: req.admin?.adminId,
        ip: req.ip
    });
}));
exports.default = router;
