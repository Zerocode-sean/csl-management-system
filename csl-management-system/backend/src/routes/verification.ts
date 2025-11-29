import { Router } from 'express';
import { CertificateService } from '../services/certificateService';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { verificationRateLimiter } from '../middleware/rateLimiter';
import { param, validationResult } from 'express-validator';
import { query } from '../database/connection';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /verification/{cslNumber}:
 *   get:
 *     summary: Verify a certificate by CSL number
 *     tags: [Verification]
 *     parameters:
 *       - in: path
 *         name: cslNumber
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^\\d{4}-[A-Z]{2}-\\d{4}-[A-Z0-9]{6}$'
 *           example: '2025-CS-0001-ABC123'
 *         description: The CSL number to verify
 *     responses:
 *       200:
 *         description: Verification result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VerificationResult'
 *       400:
 *         description: Invalid CSL format
 *       429:
 *         description: Too many verification attempts
 *       500:
 *         description: Verification service error
 */
router.get('/:cslNumber',
  verificationRateLimiter,
  [
    param('cslNumber')
      .matches(/^\d{4}-[A-Z]{2}-\d{4}-[A-Z0-9]{6}$/)
      .withMessage('Invalid CSL number format. Expected format: YYYY-CC-NNNN-VVVVVV')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Invalid CSL number format', 400, errors.array().map((err: any) => ({
        field: err.param,
        message: err.msg
      })));
    }

    const { cslNumber } = req.params;
    if (typeof cslNumber !== 'string' || !cslNumber) {
      throw createError('Missing or invalid CSL number', 400);
    }
    const clientIP = req.ip;
    const userAgent = req.get('User-Agent');

    // Log verification attempt
    await query(`
      INSERT INTO verification_logs (
        csl_number, ip_address, user_agent, verified_at
      ) VALUES ($1, $2, $3, NOW())
    `, [cslNumber, clientIP, userAgent]);

    logger.info('Certificate verification attempt:', {
      cslNumber,
      ip: clientIP,
      userAgent
    });

    // Verify the certificate
    const verificationResult = await CertificateService.verifyCertificate(cslNumber);

    // Update verification log with result
    await query(`
      UPDATE verification_logs 
      SET verification_result = $2,
          response_message = $3
      WHERE csl_number = $1 
        AND ip_address = $4 
        AND verified_at >= NOW() - INTERVAL '1 minute'
    `, [cslNumber, verificationResult.valid, verificationResult.message, clientIP]);

    logger.info('Certificate verification completed:', {
      cslNumber,
      valid: verificationResult.valid,
      message: verificationResult.message,
      ip: clientIP
    });

    // Prepare response data
    const responseData: any = {
      success: true,
      valid: verificationResult.valid,
      csl_number: cslNumber,
      message: verificationResult.message,
      verified_at: new Date().toISOString()
    };

    // Include certificate details only if valid
    if (verificationResult.valid && verificationResult.certificate) {
      const cert = verificationResult.certificate;
      responseData.certificate = {
        student_name: cert.student_name,
        student_email: cert.student_email,
        course_name: cert.course_name,
        course_code: cert.course_code,
        issued_at: cert.issued_at,
        issuer_name: cert.issuer_name,
        status: cert.status
      };
    }

    res.json(responseData);
  })
);

/**
 * @swagger
 * /verification/batch:
 *   post:
 *     summary: Verify multiple certificates
 *     tags: [Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cslNumbers
 *             properties:
 *               cslNumbers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 10
 *                 example: ['2025-CS-0001-ABC123', '2025-WD-0002-DEF456']
 *     responses:
 *       200:
 *         description: Batch verification results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/VerificationResult'
 *       400:
 *         description: Invalid request
 */
router.post('/batch',
  verificationRateLimiter,
  asyncHandler(async (req, res) => {
    const { cslNumbers } = req.body;

    if (!Array.isArray(cslNumbers) || cslNumbers.length === 0) {
      throw createError('cslNumbers must be a non-empty array', 400);
    }

    if (cslNumbers.length > 10) {
      throw createError('Maximum 10 certificates can be verified at once', 400);
    }

    const results = [];
    const clientIP = req.ip;
    const userAgent = req.get('User-Agent');

    for (const cslNumber of cslNumbers) {
      try {
        // Validate format
        if (!CertificateService.validateCSLFormat(cslNumber)) {
          results.push({
            csl_number: cslNumber,
            valid: false,
            message: 'Invalid CSL number format'
          });
          continue;
        }

        // Log verification attempt
        await query(`
          INSERT INTO verification_logs (
            csl_number, ip_address, user_agent, verified_at
          ) VALUES ($1, $2, $3, NOW())
        `, [cslNumber, clientIP, userAgent]);

        // Verify the certificate
        const verificationResult = await CertificateService.verifyCertificate(cslNumber);

        // Update verification log with result
        await query(`
          UPDATE verification_logs 
          SET verification_result = $2,
              response_message = $3
          WHERE csl_number = $1 
            AND ip_address = $4 
            AND verified_at >= NOW() - INTERVAL '1 minute'
        `, [cslNumber, verificationResult.valid, verificationResult.message, clientIP]);

        const resultData: any = {
          csl_number: cslNumber,
          valid: verificationResult.valid,
          message: verificationResult.message
        };

        if (verificationResult.valid && verificationResult.certificate) {
          const cert = verificationResult.certificate;
          resultData.certificate = {
            student_name: cert.student_name,
            course_name: cert.course_name,
            course_code: cert.course_code,
            issued_at: cert.issued_at,
            status: cert.status
          };
        }

        results.push(resultData);

      } catch (error) {
        logger.error('Batch verification error for CSL:', { cslNumber, error });
        results.push({
          csl_number: cslNumber,
          valid: false,
          message: 'Verification service error'
        });
      }
    }

    logger.info('Batch certificate verification completed:', {
      totalRequested: cslNumbers.length,
      validCount: results.filter(r => r.valid).length,
      ip: clientIP
    });

    res.json({
      success: true,
      results
    });
  })
);

/**
 * @swagger
 * /verification/stats:
 *   get:
 *     summary: Get verification statistics (public endpoint)
 *     tags: [Verification]
 *     responses:
 *       200:
 *         description: Verification statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_verifications_today:
 *                       type: integer
 *                     total_certificates_issued:
 *                       type: integer
 *                     total_active_certificates:
 *                       type: integer
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const statsResult = await query(`
    SELECT 
      (SELECT COUNT(*) FROM verification_logs WHERE DATE(verified_at) = CURRENT_DATE) as total_verifications_today,
      (SELECT COUNT(*) FROM certificates) as total_certificates_issued,
      (SELECT COUNT(*) FROM certificates WHERE status = 'active') as total_active_certificates
  `);

  const stats = statsResult.rows[0];

  res.json({
    success: true,
    data: {
      total_verifications_today: parseInt(stats.total_verifications_today),
      total_certificates_issued: parseInt(stats.total_certificates_issued),
      total_active_certificates: parseInt(stats.total_active_certificates)
    }
  });
}));

export default router;
