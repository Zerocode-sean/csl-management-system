import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../database/connection';
import { generateTokens, verifyRefreshToken } from '../middleware/auth';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { authRateLimiter } from '../middleware/rateLimiter';
import { body, validationResult } from 'express-validator';
import { config } from '../config';
import { logger } from '../utils/logger';

const router = Router();

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
router.post('/login', 
  authRateLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400, errors.array().map(err => ({
        field: (err as any).param || (err as any).path,
        message: err.msg
      })));
    }

    const { email, password } = req.body;

    // Get admin with password
    const result = await query(`
      SELECT admin_id, username, email, CONCAT(first_name, ' ', last_name) as name, role, password_hash, is_active,
             failed_login_attempts, account_locked_until, last_login_at
      FROM admins 
      WHERE email = $1
    `, [email]);

    if (result.rows.length === 0) {
      throw createError('Invalid email or password', 401);
    }

    const admin = result.rows[0];

    // Check if account is locked
    if (admin.account_locked_until && new Date() < new Date(admin.account_locked_until)) {
      throw createError('Account is temporarily locked. Please try again later.', 423);
    }

    // Check if admin is active
    if (!admin.is_active) {
      throw createError('Account is deactivated', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const failedAttempts = admin.failed_login_attempts + 1;
      const lockUntil = failedAttempts >= config.security.maxLoginAttempts 
        ? new Date(Date.now() + config.security.lockoutDuration * 60 * 1000)
        : null;

      await query(`
        UPDATE admins 
        SET failed_login_attempts = $1, 
            account_locked_until = $2,
            updated_at = NOW()
        WHERE admin_id = $3
      `, [failedAttempts, lockUntil, admin.admin_id]);

      if (lockUntil) {
        logger.warn('Account locked due to failed login attempts:', {
          adminId: admin.admin_id,
          email: admin.email,
          attempts: failedAttempts,
          lockUntil,
          ip: req.ip
        });
        throw createError('Too many failed attempts. Account locked temporarily.', 423);
      }

      throw createError('Invalid email or password', 401, undefined, {
        failedAttempts,
        maxAttempts: config.security.maxLoginAttempts
      });
    }

    // Reset failed login attempts and update last login
    await query(`
      UPDATE admins 
      SET failed_login_attempts = 0,
          account_locked_until = NULL,
          last_login_at = NOW(),
          updated_at = NOW()
      WHERE admin_id = $1
    `, [admin.admin_id]);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(admin);

    // Remove sensitive data
    delete admin.password_hash;
    delete admin.failed_login_attempts;
    delete admin.account_locked_until;

    logger.info('Admin login successful:', {
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
  })
);

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
router.post('/refresh', 
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400, errors.array().map(err => ({
        field: (err as any).param || (err as any).path,
        message: err.msg
      })));
    }

    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Get admin details
    const result = await query(
      'SELECT admin_id, username, email, role, is_active FROM admins WHERE admin_id = $1',
      [decoded.adminId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      throw createError('Invalid refresh token', 401);
    }

    const admin = result.rows[0];

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(admin);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  })
);

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
router.get('/verify', asyncHandler(async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw createError('Access token required', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as any;

    // Get admin details
    const result = await query(
      'SELECT admin_id, username, email, CONCAT(first_name, \' \', last_name) as name, role, is_active, last_login_at FROM admins WHERE admin_id = $1 AND is_active = true',
      [decoded.adminId]
    );

    if (result.rows.length === 0) {
      throw createError('Invalid or expired token', 401);
    }

    const admin = result.rows[0];

    res.json({
      success: true,
      data: admin
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw createError('Invalid token', 401);
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
router.post('/logout', asyncHandler(async (req, res) => {
  // In a real implementation, you might want to blacklist the token
  // For now, we'll just return success (client should remove token)
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

export default router;
