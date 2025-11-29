"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.generateTokens = exports.authorizeRoles = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("./errorHandler");
const connection_1 = require("../database/connection");
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            throw (0, errorHandler_1.createError)('Access token required', 401);
        }
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
        // Verify admin still exists and is active
        const result = await (0, connection_1.query)('SELECT admin_id, username, email, role, is_active FROM admins WHERE admin_id = $1 AND is_active = true', [decoded.adminId]);
        if (result.rows.length === 0) {
            throw (0, errorHandler_1.createError)('Invalid or expired token', 401);
        }
        const admin = result.rows[0];
        req.admin = {
            adminId: admin.admin_id,
            username: admin.username,
            email: admin.email,
            role: admin.role
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            logger_1.logger.warn('JWT verification failed:', {
                error: error.message,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            next((0, errorHandler_1.createError)('Invalid token', 401));
        }
        else {
            next(error);
        }
    }
};
exports.authenticateToken = authenticateToken;
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.admin) {
            next((0, errorHandler_1.createError)('Authentication required', 401));
            return;
        }
        if (!roles.includes(req.admin.role)) {
            logger_1.logger.warn('Insufficient permissions:', {
                adminId: req.admin.adminId,
                role: req.admin.role,
                requiredRoles: roles,
                url: req.url,
                method: req.method
            });
            next((0, errorHandler_1.createError)('Insufficient permissions', 403));
            return;
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
const generateTokens = (admin) => {
    const payload = {
        adminId: admin.admin_id,
        username: admin.username,
        email: admin.email,
        role: admin.role
    };
    const accessToken = jsonwebtoken_1.default.sign(payload, config_1.config.jwt.secret, {
        expiresIn: config_1.config.jwt.expiresIn,
        issuer: 'csl-management-system',
        audience: 'csl-api'
    });
    const refreshToken = jsonwebtoken_1.default.sign({ adminId: admin.admin_id }, config_1.config.jwt.refreshSecret, {
        expiresIn: config_1.config.jwt.refreshExpiresIn,
        issuer: 'csl-management-system',
        audience: 'csl-api'
    });
    return { accessToken, refreshToken };
};
exports.generateTokens = generateTokens;
const verifyRefreshToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.refreshSecret);
        return decoded;
    }
    catch (error) {
        throw (0, errorHandler_1.createError)('Invalid refresh token', 401);
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
