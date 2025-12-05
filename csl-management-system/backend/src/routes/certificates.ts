import { Router } from 'express';
import { CertificateService } from '../services/certificateService';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { body, param, query as queryValidator, validationResult } from 'express-validator';
import { query } from '../database/connection';
import { logger } from '../utils/logger';

const router = Router();

// All certificate routes require authentication
router.use(authenticateToken);

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
router.get('/',
  [
    queryValidator('page').optional().isInt({ min: 1 }).toInt(),
    queryValidator('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    queryValidator('status').optional().isIn(['active', 'revoked', 'suspended']),
    queryValidator('course_id').optional().isUUID(),
    queryValidator('student_id').optional().isUUID(),
    queryValidator('search').optional().isString().trim()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400, errors.array().map((err: any) => ({
        field: err.param,
        message: err.msg
      })));
    }

    const result = await CertificateService.getCertificates({
      page: parseInt(req.query['page'] as string, 10) || 1,
      limit: parseInt(req.query['limit'] as string, 10) || 10,
      status: req.query['status'] as string,
      courseId: req.query['course_id'] as string,
      studentId: req.query['student_id'] as string,
      search: req.query['search'] as string
    });

    res.json({
      success: true,
      data: result
    });
  })
);

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
router.get('/stats', asyncHandler(async (req, res) => {
  const statsResult = await query(`
    SELECT
      COUNT(*) as total_certificates,
      COUNT(*) FILTER (WHERE status = 'active') as active_certificates,
      COUNT(*) FILTER (WHERE status = 'revoked') as revoked_certificates,
      COUNT(*) FILTER (WHERE status = 'suspended') as suspended_certificates,
      COUNT(*) FILTER (WHERE DATE(issued_at) = CURRENT_DATE) as issued_today,
      COUNT(*) FILTER (WHERE DATE(issued_at) >= CURRENT_DATE - INTERVAL '30 days') as issued_last_30_days
    FROM certificates
  `);

  const courseStatsResult = await query(`
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
router.get('/:id',
  [
    param('id').isUUID().withMessage('Valid certificate ID is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400, errors.array().map((err: any) => ({
        field: err.param,
        message: err.msg
      })));
    }

    const { id } = req.params;

    const result = await query(`
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
      throw createError('Certificate not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  })
);

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
router.post('/generate',
  authorizeRoles('super_admin', 'admin', 'course_manager'),
  [
    body('student_id').isInt().withMessage('Valid student ID is required'),
    body('course_id').isInt().withMessage('Valid course ID is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400, errors.array().map((err: any) => ({
        field: err.param,
        message: err.msg
      })));
    }

    const { student_id, course_id } = req.body;
    const admin_id = parseInt(req.admin!.adminId, 10);

    logger.info('Certificate generation requested', {
      student_id,
      course_id,
      admin_id
    });

    // Use the new CertificateGeneratorService from cloud.md
    const { CertificateGeneratorService } = await import('../services/certificateGenerator.service');
    
    const result = await CertificateGeneratorService.generateCertificate(
      student_id,
      course_id,
      admin_id
    );

    logger.info('Certificate generated successfully', {
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
  })
);

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
router.patch('/:id/revoke',
  authorizeRoles('super_admin', 'admin'),
  [
    param('id').isUUID().withMessage('Valid certificate ID is required'),
    body('reason').optional().isString().isLength({ max: 500 }).withMessage('Reason must be a string with maximum 500 characters')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400, errors.array().map((err: any) => ({
        field: err.param,
        message: err.msg
      })));
    }

    const id = req.params['id'];
    if (typeof id !== 'string' || !id) {
      throw createError('Missing or invalid certificate ID', 400);
    }
    if (typeof id !== 'string' || !id) {
      throw createError('Missing or invalid certificate ID', 400);
    }
    const reason = req.body.reason || 'No reason provided';
    const revoked_by = req.admin?.adminId;
    if (typeof revoked_by !== 'string' || !revoked_by) {
      throw createError('Missing or invalid admin ID for revocation', 400);
    }

    // Get certificate details before revoking
    const beforeResult = await query(
      'SELECT * FROM certificates WHERE certificate_id = $1',
      [id]
    );

    if (beforeResult.rows.length === 0) {
      throw createError('Certificate not found', 404);
    }

  const certificate = await CertificateService.revokeCertificate(id as string, revoked_by, reason);

    // Log the action in audit logs
    await query(`
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
  })
);

/**
 * @swagger
 * /certificates/{cslNumber}/download:

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
router.get('/:cslNumber/download',
  [
    param('cslNumber').isString().trim().notEmpty().withMessage('Valid CSL number is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400, errors.array().map((err: any) => ({
        field: err.param,
        message: err.msg
      })));
    }

    const { cslNumber } = req.params;

    // Verify certificate exists in database
    const certResult = await query(
      'SELECT csl_number FROM certificates WHERE csl_number = $1',
      [cslNumber]
    );

    if (certResult.rows.length === 0) {
      throw createError('Certificate not found', 404);
    }

    // Get PDF file path
    const { PDFService } = await import('../services/PDFService');
    const pdfPath = PDFService.getPDFPath(cslNumber!);
    
    // Check if PDF file exists
    const pdfExists = await PDFService.pdfExists(cslNumber!);
    if (!pdfExists) {
      throw createError('PDF file not found. It may need to be regenerated.', 404);
    }

    // Send PDF file with absolute path
    const path = await import('path');
    const absolutePdfPath = path.resolve(pdfPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${cslNumber}.pdf"`);
    res.sendFile(absolutePdfPath);

    logger.info(`PDF downloaded for CSL: ${cslNumber}`, {
      admin_id: req.admin!.adminId,
      ip: req.ip
    });
  })
);

export default router;
