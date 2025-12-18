import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// General rate limiter
export const rateLimiter = rateLimit({
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
export const authRateLimiter = rateLimit({
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
export const verificationRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 verification attempts per minute
  message: {
    success: false,
    message: 'Too many verification attempts, please wait before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});