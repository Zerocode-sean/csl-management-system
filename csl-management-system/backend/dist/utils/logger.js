"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const config_1 = require("../config");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure log directory exists
const logDir = config_1.config.logging.dir;
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir, { recursive: true });
}
// Define log format
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.printf((info) => {
    const { timestamp, level, message, ...extra } = info;
    return JSON.stringify({
        timestamp,
        level,
        message,
        ...extra
    });
}));
// Console format for development
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'HH:mm:ss' }), winston_1.default.format.printf((info) => {
    const { timestamp, level, message, ...extra } = info;
    const extraStr = Object.keys(extra).length ? JSON.stringify(extra, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${extraStr}`;
}));
// Create logger
exports.logger = winston_1.default.createLogger({
    level: config_1.config.logging.level,
    format: logFormat,
    defaultMeta: { service: 'csl-backend' },
    transports: [
        // Error log file
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Combined log file
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
});
// Add console transport in development
if (config_1.config.nodeEnv !== 'production') {
    exports.logger.add(new winston_1.default.transports.Console({
        format: consoleFormat
    }));
}
// Handle uncaught exceptions and unhandled rejections
exports.logger.exceptions.handle(new winston_1.default.transports.File({
    filename: path_1.default.join(logDir, 'exceptions.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
}));
exports.logger.rejections.handle(new winston_1.default.transports.File({
    filename: path_1.default.join(logDir, 'rejections.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
}));
exports.default = exports.logger;
