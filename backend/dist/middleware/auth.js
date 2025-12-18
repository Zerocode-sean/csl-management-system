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
exports.verifyRefreshToken = exports.generateTokens = exports.authorizeRoles = exports.authenticateToken = void 0;
const jwt = __importStar(require("jsonwebtoken"));
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
        const decoded = jwt.verify(token, config_1.config.jwt.secret);
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
        if (error instanceof jwt.JsonWebTokenError) {
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
    const accessTokenOptions = {
        expiresIn: config_1.config.jwt.expiresIn,
        issuer: 'csl-management-system',
        audience: 'csl-api'
    };
    const refreshTokenOptions = {
        expiresIn: config_1.config.jwt.refreshExpiresIn,
        issuer: 'csl-management-system',
        audience: 'csl-api'
    };
    const accessToken = jwt.sign(payload, config_1.config.jwt.secret, accessTokenOptions);
    const refreshToken = jwt.sign({ adminId: admin.admin_id }, config_1.config.jwt.refreshSecret, refreshTokenOptions);
    return { accessToken, refreshToken };
};
exports.generateTokens = generateTokens;
const verifyRefreshToken = (token) => {
    try {
        const decoded = jwt.verify(token, config_1.config.jwt.refreshSecret);
        return decoded;
    }
    catch (error) {
        throw (0, errorHandler_1.createError)('Invalid refresh token', 401);
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
