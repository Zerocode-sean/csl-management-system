"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimiter = exports.verificationRateLimiter = exports.rateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
// General rate limiter
exports.rateLimiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.config.rateLimit.windowMs,
    max: config_1.config.rateLimit.maxRequests,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.logger.warn('Rate limit exceeded', {
            ip: req.ip,
            url: req.url,
            method: req.method,
            userAgent: req.get('User-Agent')
        });
        res.status(429).json({
            success: false,
            message: 'Too many requests from this IP, please try again later.',
        });
    },
});
// Strict rate limiter for verification endpoint
exports.verificationRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.config.rateLimit.verificationWindowMs,
    max: config_1.config.rateLimit.verificationMaxRequests,
    message: {
        success: false,
        message: 'Too many verification attempts, please wait before trying again.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use IP + CSL number for more granular rate limiting
        const cslNumber = req.params.cslNumber || req.body.cslNumber;
        return `${req.ip}-${cslNumber}`;
    },
    handler: (req, res) => {
        logger_1.logger.warn('Verification rate limit exceeded', {
            ip: req.ip,
            cslNumber: req.params.cslNumber || req.body.cslNumber,
            url: req.url,
            userAgent: req.get('User-Agent')
        });
        res.status(429).json({
            success: false,
            message: 'Too many verification attempts for this certificate, please wait before trying again.',
        });
    },
});
// Auth rate limiter for login attempts
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
        success: false,
        message: 'Too many login attempts, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
    handler: (req, res) => {
        logger_1.logger.warn('Auth rate limit exceeded', {
            ip: req.ip,
            email: req.body.email || req.body.username,
            url: req.url,
            userAgent: req.get('User-Agent')
        });
        res.status(429).json({
            success: false,
            message: 'Too many login attempts from this IP, please try again later.',
        });
    },
});
