"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const connection_1 = require("../database/connection");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const rateLimiter_1 = require("../middleware/rateLimiter");
const express_validator_1 = require("express-validator");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Admin login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@csl.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: Admin@2025
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     admin:
 *                       $ref: '#/components/schemas/Admin'
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 *       423:
 *         description: Account locked
 *       429:
 *         description: Too many attempts
 */
router.post('/login', rateLimiter_1.authRateLimiter, [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map(err => ({
            field: err.param || err.path,
            message: err.msg
        })));
    }
    const { email, password } = req.body;
    // Get admin with password
    const result = await (0, connection_1.query)(`
      SELECT admin_id, username, email, CONCAT(first_name, ' ', last_name) as name, role, password_hash, is_active,
             failed_login_attempts, account_locked_until, last_login_at
      FROM admins 
      WHERE email = $1
    `, [email]);
    if (result.rows.length === 0) {
        throw (0, errorHandler_1.createError)('Invalid email or password', 401);
    }
    const admin = result.rows[0];
    // Check if account is locked
    if (admin.account_locked_until && new Date() < new Date(admin.account_locked_until)) {
        throw (0, errorHandler_1.createError)('Account is temporarily locked. Please try again later.', 423);
    }
    // Check if admin is active
    if (!admin.is_active) {
        throw (0, errorHandler_1.createError)('Account is deactivated', 401);
    }
    // Verify password
    const isPasswordValid = await bcryptjs_1.default.compare(password, admin.password_hash);
    if (!isPasswordValid) {
        // Increment failed login attempts
        const failedAttempts = admin.failed_login_attempts + 1;
        const lockUntil = failedAttempts >= config_1.config.security.maxLoginAttempts
            ? new Date(Date.now() + config_1.config.security.lockoutDuration * 60 * 1000)
            : null;
        await (0, connection_1.query)(`
        UPDATE admins 
        SET failed_login_attempts = $1, 
            account_locked_until = $2,
            updated_at = NOW()
        WHERE admin_id = $3
      `, [failedAttempts, lockUntil, admin.admin_id]);
        if (lockUntil) {
            logger_1.logger.warn('Account locked due to failed login attempts:', {
                adminId: admin.admin_id,
                email: admin.email,
                attempts: failedAttempts,
                lockUntil,
                ip: req.ip
            });
            throw (0, errorHandler_1.createError)('Too many failed attempts. Account locked temporarily.', 423);
        }
        throw (0, errorHandler_1.createError)('Invalid email or password', 401, undefined, {
            failedAttempts,
            maxAttempts: config_1.config.security.maxLoginAttempts
        });
    }
    // Reset failed login attempts and update last login
    await (0, connection_1.query)(`
      UPDATE admins 
      SET failed_login_attempts = 0,
          account_locked_until = NULL,
          last_login_at = NOW(),
          updated_at = NOW()
      WHERE admin_id = $1
    `, [admin.admin_id]);
    // Generate tokens
    const { accessToken, refreshToken } = (0, auth_1.generateTokens)(admin);
    // Remove sensitive data
    delete admin.password_hash;
    delete admin.failed_login_attempts;
    delete admin.account_locked_until;
    logger_1.logger.info('Admin login successful:', {
        adminId: admin.admin_id,
        email: admin.email,
        role: admin.role,
        ip: req.ip
    });
    res.json({
        success: true,
        message: 'Login successful',
        data: {
            admin,
            accessToken,
            refreshToken
        }
    });
}));
/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', [
    (0, express_validator_1.body)('refreshToken').notEmpty().withMessage('Refresh token is required')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map(err => ({
            field: err.param || err.path,
            message: err.msg
        })));
    }
    const { refreshToken } = req.body;
    // Verify refresh token
    const decoded = (0, auth_1.verifyRefreshToken)(refreshToken);
    // Get admin details
    const result = await (0, connection_1.query)('SELECT admin_id, username, email, role, is_active FROM admins WHERE admin_id = $1', [decoded.adminId]);
    if (result.rows.length === 0 || !result.rows[0].is_active) {
        throw (0, errorHandler_1.createError)('Invalid refresh token', 401);
    }
    const admin = result.rows[0];
    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = (0, auth_1.generateTokens)(admin);
    res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
            accessToken,
            refreshToken: newRefreshToken
        }
    });
}));
/**
 * @swagger
 * /auth/verify:
 *   get:
 *     summary: Verify access token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Admin'
 *       401:
 *         description: Invalid or expired token
 */
router.get('/verify', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            throw (0, errorHandler_1.createError)('Access token required', 401);
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
        // Get admin details
        const result = await (0, connection_1.query)('SELECT admin_id, username, email, CONCAT(first_name, \' \', last_name) as name, role, is_active, last_login_at FROM admins WHERE admin_id = $1 AND is_active = true', [decoded.adminId]);
        if (result.rows.length === 0) {
            throw (0, errorHandler_1.createError)('Invalid or expired token', 401);
        }
        const admin = result.rows[0];
        res.json({
            success: true,
            data: admin
        });
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw (0, errorHandler_1.createError)('Invalid token', 401);
        }
        throw error;
    }
}));
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Admin logout
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // In a real implementation, you might want to blacklist the token
    // For now, we'll just return success (client should remove token)
    res.json({
        success: true,
        message: 'Logout successful'
    });
}));
exports.default = router;
