"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const settings_service_1 = require("../services/settings.service");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/v1/settings/profile
 * @desc    Get current admin profile
 * @access  Private
 */
router.get('/profile', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const adminId = req.admin?.adminId;
    if (!adminId) {
        throw (0, errorHandler_1.createError)('Admin ID not found', 401);
    }
    const profile = await settings_service_1.SettingsService.getProfile(parseInt(adminId, 10));
    res.json({
        success: true,
        data: profile
    });
}));
/**
 * @route   PUT /api/v1/settings/profile
 * @desc    Update admin profile
 * @access  Private
 */
router.put('/profile', auth_1.authenticateToken, [
    (0, express_validator_1.body)('firstName').trim().notEmpty().withMessage('First name is required'),
    (0, express_validator_1.body)('lastName').trim().notEmpty().withMessage('Last name is required'),
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('mobile').optional().trim()
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map((err) => ({
            field: err.path,
            message: err.msg
        })));
    }
    const adminId = req.admin?.adminId;
    if (!adminId) {
        throw (0, errorHandler_1.createError)('Admin ID not found', 401);
    }
    const { firstName, lastName, email, mobile } = req.body;
    try {
        const updatedProfile = await settings_service_1.SettingsService.updateProfile(parseInt(adminId, 10), { firstName, lastName, email, mobile });
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedProfile
        });
    }
    catch (error) {
        if (error.message === 'Email address is already in use') {
            throw (0, errorHandler_1.createError)(error.message, 409);
        }
        throw error;
    }
}));
/**
 * @route   PUT /api/v1/settings/password
 * @desc    Change admin password
 * @access  Private
 */
router.put('/password', auth_1.authenticateToken, [
    (0, express_validator_1.body)('currentPassword').notEmpty().withMessage('Current password is required'),
    (0, express_validator_1.body)('newPassword')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    (0, express_validator_1.body)('confirmPassword')
        .notEmpty()
        .withMessage('Please confirm your new password')
        .custom((value, { req }) => value === req.body.newPassword)
        .withMessage('Passwords do not match')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map((err) => ({
            field: err.path,
            message: err.msg
        })));
    }
    const adminId = req.admin?.adminId;
    if (!adminId) {
        throw (0, errorHandler_1.createError)('Admin ID not found', 401);
    }
    const { currentPassword, newPassword } = req.body;
    try {
        const result = await settings_service_1.SettingsService.changePassword(parseInt(adminId, 10), { currentPassword, newPassword });
        res.json({
            success: true,
            message: result.message
        });
    }
    catch (error) {
        if (error.message === 'Current password is incorrect') {
            throw (0, errorHandler_1.createError)(error.message, 401);
        }
        throw error;
    }
}));
/**
 * @route   GET /api/v1/settings/preferences
 * @desc    Get admin preferences
 * @access  Private
 */
router.get('/preferences', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const adminId = req.admin?.adminId;
    if (!adminId) {
        throw (0, errorHandler_1.createError)('Admin ID not found', 401);
    }
    const preferences = await settings_service_1.SettingsService.getPreferences(parseInt(adminId, 10));
    res.json({
        success: true,
        data: preferences
    });
}));
/**
 * @route   PUT /api/v1/settings/preferences
 * @desc    Update admin preferences
 * @access  Private
 */
router.put('/preferences', auth_1.authenticateToken, [
    (0, express_validator_1.body)('emailNotifications').optional().isBoolean(),
    (0, express_validator_1.body)('studentEnrollmentNotifications').optional().isBoolean(),
    (0, express_validator_1.body)('certificateNotifications').optional().isBoolean(),
    (0, express_validator_1.body)('systemNotifications').optional().isBoolean(),
    (0, express_validator_1.body)('timezone').optional().trim(),
    (0, express_validator_1.body)('language').optional().trim().isLength({ min: 2, max: 10 }),
    (0, express_validator_1.body)('dateFormat').optional().trim(),
    (0, express_validator_1.body)('itemsPerPage').optional().isInt({ min: 5, max: 100 })
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map((err) => ({
            field: err.path,
            message: err.msg
        })));
    }
    const adminId = req.admin?.adminId;
    if (!adminId) {
        throw (0, errorHandler_1.createError)('Admin ID not found', 401);
    }
    const preferences = await settings_service_1.SettingsService.updatePreferences(parseInt(adminId, 10), req.body);
    res.json({
        success: true,
        message: 'Preferences updated successfully',
        data: preferences
    });
}));
/**
 * @route   GET /api/v1/settings/system
 * @desc    Get system configuration
 * @access  Private (Admin only)
 */
router.get('/system', auth_1.authenticateToken, (0, auth_1.authorizeRoles)('admin'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const config = await settings_service_1.SettingsService.getSystemConfig();
    res.json({
        success: true,
        data: config
    });
}));
/**
 * @route   PUT /api/v1/settings/system/:configKey
 * @desc    Update system configuration
 * @access  Private (Admin only)
 */
router.put('/system/:configKey', auth_1.authenticateToken, (0, auth_1.authorizeRoles)('admin'), [
    (0, express_validator_1.body)('configValue').trim().notEmpty().withMessage('Configuration value is required')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map((err) => ({
            field: err.path,
            message: err.msg
        })));
    }
    const adminId = req.admin?.adminId;
    const { configKey } = req.params;
    const { configValue } = req.body;
    if (!adminId) {
        throw (0, errorHandler_1.createError)('Admin ID not found', 401);
    }
    if (!configKey) {
        throw (0, errorHandler_1.createError)('Configuration key is required', 400);
    }
    const updatedConfig = await settings_service_1.SettingsService.updateSystemConfig(parseInt(adminId, 10), configKey, configValue);
    res.json({
        success: true,
        message: 'System configuration updated successfully',
        data: updatedConfig
    });
}));
exports.default = router;
