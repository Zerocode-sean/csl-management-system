"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.createError = exports.notFoundHandler = exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errorHandler = (err, req, res, next) => {
    logger_1.logger.error('API Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({
        success: false,
        message,
        errors: err.errors || [],
        ...(process.env['NODE_ENV'] === 'development' && { stack: err.stack })
    });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res, next) => {
    const message = `Route ${req.method} ${req.url} not found`;
    logger_1.logger.warn('404 Not Found:', {
        url: req.url,
        method: req.method,
        ip: req.ip
    });
    res.status(404).json({
        success: false,
        message
    });
};
exports.notFoundHandler = notFoundHandler;
const createError = (message, statusCode = 500, errors) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    if (errors) {
        error.errors = errors;
    }
    return error;
};
exports.createError = createError;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
