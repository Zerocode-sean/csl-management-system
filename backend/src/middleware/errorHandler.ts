import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  errors?: Array<{ field: string; message: string }>;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('API Error:', {
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

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const message = `Route ${req.method} ${req.url} not found`;
  
  logger.warn('404 Not Found:', {
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(404).json({
    success: false,
    message
  });
};

export const createError = (
  message: string,
  statusCode: number = 500,
  errors?: Array<{ field: string; message: string }>
): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  if (errors) {
    error.errors = errors;
  }
  return error;
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void | any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
