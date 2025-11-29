import * as jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { logger } from '../utils/logger';
import { createError } from './errorHandler';
import { query } from '../database/connection';

interface JwtPayload {
  adminId: string;
  username: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      admin?: JwtPayload;
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw createError('Access token required', 401);
    }

    const decoded = jwt.verify(token, config.jwt.secret as string) as JwtPayload;
    
    // Verify admin still exists and is active
    const result = await query(
      'SELECT admin_id, username, email, role, is_active FROM admins WHERE admin_id = $1 AND is_active = true',
      [decoded.adminId]
    );

    if (result.rows.length === 0) {
      throw createError('Invalid or expired token', 401);
    }

    const admin = result.rows[0];
    req.admin = {
      adminId: admin.admin_id,
      username: admin.username,
      email: admin.email,
      role: admin.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('JWT verification failed:', {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next(createError('Invalid token', 401));
    } else {
      next(error);
    }
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      next(createError('Authentication required', 401));
      return;
    }

    if (!roles.includes(req.admin.role)) {
      logger.warn('Insufficient permissions:', {
        adminId: req.admin.adminId,
        role: req.admin.role,
        requiredRoles: roles,
        url: req.url,
        method: req.method
      });
      next(createError('Insufficient permissions', 403));
      return;
    }

    next();
  };
};

export const generateTokens = (admin: any) => {
  const payload = {
    adminId: admin.admin_id,
    username: admin.username,
    email: admin.email,
    role: admin.role
  };

  const accessTokenOptions = {
    expiresIn: config.jwt.expiresIn,
    issuer: 'csl-management-system',
    audience: 'csl-api'
  };

  const refreshTokenOptions = {
    expiresIn: config.jwt.refreshExpiresIn,
    issuer: 'csl-management-system',
    audience: 'csl-api'
  };

  const accessToken = jwt.sign(payload, config.jwt.secret as string, accessTokenOptions as any);
  const refreshToken = jwt.sign({ adminId: admin.admin_id }, config.jwt.refreshSecret as string, refreshTokenOptions as any);

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token: string): { adminId: string } => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret as string) as { adminId: string };
    return decoded;
  } catch (error) {
    throw createError('Invalid refresh token', 401);
  }
};
