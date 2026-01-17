"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Rate limiting for public verification
const verifyLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per IP per minute
    message: {
        success: false,
        message: 'Too many verification requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * @swagger
 * /public/verify/{cslNumber}:
 *   get:
 *     summary: Verify certificate by CSL number (PUBLIC - No Auth Required)
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: cslNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: CSL certificate number (e.g., 2025-CS101-0001-37B620)
 *     responses:
 *       200:
 *         description: Certificate verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 valid:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Certificate not found
 */
router.get('/verify/:cslNumber', verifyLimiter, [
    (0, express_validator_1.param)('cslNumber')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Valid CSL number is required')
        .matches(/^\d{4}-[A-Z0-9]{2,20}-\d{4}-[A-Z0-9]{6}$/)
        .withMessage('Invalid CSL number format')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Invalid CSL number format', 400, errors.array().map((err) => ({
            field: err.param,
            message: err.msg
        })));
    }
    const { cslNumber } = req.params;
    try {
        // Query certificate with limited data for privacy
        const result = await (0, connection_1.query)(`
        SELECT 
          c.csl_number,
          c.status,
          c.issue_date,
          c.revoked_at,
          s.name as student_name,
          co.title as course_name,
          co.code as course_code,
          co.duration_months,
          s.current_grade as grade
        FROM certificates c
        JOIN students s ON c.student_id = s.student_id
        JOIN courses co ON c.course_id = co.course_id
        WHERE c.csl_number = $1
      `, [cslNumber]);
        if (result.rows.length === 0) {
            // Log failed verification attempt
            await (0, connection_1.query)(`
          INSERT INTO public_verifications (csl_number, ip_address, user_agent, verification_result)
          VALUES ($1, $2, $3, 'not_found')
        `, [cslNumber, req.ip, req.get('User-Agent')]).catch((err) => {
                logger_1.logger.warn('Failed to log verification attempt:', err);
                // Don't fail the request if logging fails
            });
            return res.status(404).json({
                success: false,
                valid: false,
                message: 'Certificate not found',
                csl_number: cslNumber
            });
        }
        const cert = result.rows[0];
        // Mask student name for privacy
        const maskedName = maskStudentName(cert.student_name);
        // Get verification count
        const countResult = await (0, connection_1.query)('SELECT COUNT(*) as count FROM public_verifications WHERE csl_number = $1 AND verification_result != \'not_found\'', [cslNumber]).catch(() => ({ rows: [{ count: 0 }] }));
        const verificationCount = parseInt(countResult.rows[0].count) + 1;
        // Log successful verification
        await (0, connection_1.query)(`
        INSERT INTO public_verifications (csl_number, ip_address, user_agent, verification_result)
        VALUES ($1, $2, $3, $4)
      `, [cslNumber, req.ip, req.get('User-Agent'), cert.status]).catch((err) => {
            logger_1.logger.warn('Failed to log verification:', err);
            // Don't fail the request if logging fails
        });
        return res.json({
            success: true,
            valid: cert.status === 'active',
            data: {
                csl_number: cert.csl_number,
                status: cert.status,
                student_name: maskedName,
                course: {
                    name: cert.course_name,
                    code: cert.course_code,
                    duration: `${cert.duration_months} months`
                },
                dates: {
                    issue_date: cert.issue_date,
                    revoked_at: cert.revoked_at || null
                },
                grade: cert.grade || null,
                issuer: 'EMESA Research and Consultancy',
                verification_count: verificationCount,
                verified_at: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Verification error:', error);
        throw (0, errorHandler_1.createError)('Verification failed. Please try again.', 500);
    }
}));
/**
 * Helper function to mask student name for privacy
 * Example: "John Doe" → "John D******"
 */
function maskStudentName(fullName) {
    if (!fullName)
        return 'Unknown';
    const parts = fullName.trim().split(' ').filter(p => p);
    if (parts.length === 0)
        return 'Unknown';
    if (parts.length === 1)
        return parts[0] || 'Unknown';
    const firstName = parts[0] || 'Unknown';
    const lastName = parts[parts.length - 1];
    if (!lastName)
        return firstName;
    return `${firstName} ${lastName.charAt(0)}${'*'.repeat(6)}`;
}
exports.default = router;
