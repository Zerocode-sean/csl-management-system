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
exports.logger = void 0;
const winston = __importStar(require("winston"));
const config_1 = require("../config");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
// Ensure log directory exists
const logDir = config_1.config.logging.dir;
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}
// Define log format
const logFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.errors({ stack: true }), winston.format.json(), winston.format.printf((info) => {
    const { timestamp, level, message, ...extra } = info;
    return JSON.stringify({
        timestamp,
        level,
        message,
        ...extra
    });
}));
// Console format for development
const consoleFormat = winston.format.combine(winston.format.colorize(), winston.format.timestamp({ format: 'HH:mm:ss' }), winston.format.printf((info) => {
    const { timestamp, level, message, ...extra } = info;
    const extraStr = Object.keys(extra).length ? JSON.stringify(extra, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${extraStr}`;
}));
// Create logger
exports.logger = winston.createLogger({
    level: config_1.config.logging.level,
    format: logFormat,
    defaultMeta: { service: 'csl-backend' },
    transports: [
        // Error log file
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Combined log file
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
});
// Add console transport in development
if (config_1.config.nodeEnv !== 'production') {
    exports.logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}
// Handle uncaught exceptions and unhandled rejections
exports.logger.exceptions.handle(new winston.transports.File({
    filename: path.join(logDir, 'exceptions.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
}));
exports.logger.rejections.handle(new winston.transports.File({
    filename: path.join(logDir, 'rejections.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
}));
exports.default = exports.logger;
