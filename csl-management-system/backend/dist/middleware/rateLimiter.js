"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificationRateLimiter = exports.authRateLimiter = exports.rateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// General rate limiter
exports.rateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Auth rate limiter for login attempts (complements account locking)
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 login attempts per window (more lenient since we have account locking)
    message: {
        success: false,
        message: 'Too many login attempts from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Note: skipSuccessfulRequests doesn't work here since middleware runs before auth
});
// Verification rate limiter
exports.verificationRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 verification attempts per minute
    message: {
        success: false,
        message: 'Too many verification attempts, please wait before trying again.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
