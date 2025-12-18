import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { SettingsService } from '../services/settings.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route   GET /api/v1/settings/profile
 * @desc    Get current admin profile
 * @access  Private
 */
router.get(
  '/profile',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const adminId = req.admin?.adminId;
    
    if (!adminId) {
      throw createError('Admin ID not found', 401);
    }

    const profile = await SettingsService.getProfile(parseInt(adminId, 10));

    res.json({
      success: true,
      data: profile
    });
  })
);

/**
 * @route   PUT /api/v1/settings/profile
 * @desc    Update admin profile
 * @access  Private
 */
router.put(
  '/profile',
  authenticateToken,
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('mobile').optional().trim()
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400, errors.array().map((err: any) => ({
        field: err.path,
        message: err.msg
      })));
    }

    const adminId = req.admin?.adminId;
    
    if (!adminId) {
      throw createError('Admin ID not found', 401);
    }

    const { firstName, lastName, email, mobile } = req.body;

    try {
      const updatedProfile = await SettingsService.updateProfile(
        parseInt(adminId, 10),
        { firstName, lastName, email, mobile }
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile
      });
    } catch (error: any) {
      if (error.message === 'Email address is already in use') {
        throw createError(error.message, 409);
      }
      throw error;
    }
  })
);

/**
 * @route   PUT /api/v1/settings/password
 * @desc    Change admin password
 * @access  Private
 */
router.put(
  '/password',
  authenticateToken,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('confirmPassword')
      .notEmpty()
      .withMessage('Please confirm your new password')
      .custom((value, { req }) => value === req.body.newPassword)
      .withMessage('Passwords do not match')
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400, errors.array().map((err: any) => ({
        field: err.path,
        message: err.msg
      })));
    }

    const adminId = req.admin?.adminId;
    
    if (!adminId) {
      throw createError('Admin ID not found', 401);
    }

    const { currentPassword, newPassword } = req.body;

    try {
      const result = await SettingsService.changePassword(
        parseInt(adminId, 10),
        { currentPassword, newPassword }
      );

      res.json({
        success: true,
        message: result.message
      });
    } catch (error: any) {
      if (error.message === 'Current password is incorrect') {
        throw createError(error.message, 401);
      }
      throw error;
    }
  })
);

/**
 * @route   GET /api/v1/settings/preferences
 * @desc    Get admin preferences
 * @access  Private
 */
router.get(
  '/preferences',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const adminId = req.admin?.adminId;
    
    if (!adminId) {
      throw createError('Admin ID not found', 401);
    }

    const preferences = await SettingsService.getPreferences(parseInt(adminId, 10));

    res.json({
      success: true,
      data: preferences
    });
  })
);

/**
 * @route   PUT /api/v1/settings/preferences
 * @desc    Update admin preferences
 * @access  Private
 */
router.put(
  '/preferences',
  authenticateToken,
  [
    body('emailNotifications').optional().isBoolean(),
    body('studentEnrollmentNotifications').optional().isBoolean(),
    body('certificateNotifications').optional().isBoolean(),
    body('systemNotifications').optional().isBoolean(),
    body('timezone').optional().trim(),
    body('language').optional().trim().isLength({ min: 2, max: 10 }),
    body('dateFormat').optional().trim(),
    body('itemsPerPage').optional().isInt({ min: 5, max: 100 })
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400, errors.array().map((err: any) => ({
        field: err.path,
        message: err.msg
      })));
    }

    const adminId = req.admin?.adminId;
    
    if (!adminId) {
      throw createError('Admin ID not found', 401);
    }

    const preferences = await SettingsService.updatePreferences(
      parseInt(adminId, 10),
      req.body
    );

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: preferences
    });
  })
);

/**
 * @route   GET /api/v1/settings/system
 * @desc    Get system configuration
 * @access  Private (Admin only)
 */
router.get(
  '/system',
  authenticateToken,
  authorizeRoles('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const config = await SettingsService.getSystemConfig();

    res.json({
      success: true,
      data: config
    });
  })
);

/**
 * @route   PUT /api/v1/settings/system/:configKey
 * @desc    Update system configuration
 * @access  Private (Admin only)
 */
router.put(
  '/system/:configKey',
  authenticateToken,
  authorizeRoles('admin'),
  [
    body('configValue').trim().notEmpty().withMessage('Configuration value is required')
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400, errors.array().map((err: any) => ({
        field: err.path,
        message: err.msg
      })));
    }

    const adminId = req.admin?.adminId;
    const { configKey } = req.params;
    const { configValue } = req.body;
    
    if (!adminId) {
      throw createError('Admin ID not found', 401);
    }

    if (!configKey) {
      throw createError('Configuration key is required', 400);
    }

    const updatedConfig = await SettingsService.updateSystemConfig(
      parseInt(adminId, 10),
      configKey,
      configValue
    );

    res.json({
      success: true,
      message: 'System configuration updated successfully',
      data: updatedConfig
    });
  })
);

export default router;


