import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test helper utilities
 */

/**
 * Generate a test JWT token
 */
export function generateTestToken(payload: {
  userId: number;
  username: string;
  role: string;
}): string {
  const secret = process.env.JWT_SECRET || 'test-secret';
  return jwt.sign(payload, secret, { expiresIn: '1h' });
}

/**
 * Generate admin token
 */
export function generateAdminToken(): string {
  return generateTestToken({
    userId: 1,
    username: 'testadmin',
    role: 'admin',
  });
}

/**
 * Generate manager token
 */
export function generateManagerToken(): string {
  return generateTestToken({
    userId: 2,
    username: 'testmanager',
    role: 'course_manager',
  });
}

/**
 * Validate PDF file
 */
export function isPDFValid(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 5) return false;
  
  // Check PDF header
  const header = buffer.slice(0, 5).toString();
  if (header !== '%PDF-') return false;
  
  // Check PDF footer (EOF marker)
  const end = buffer.slice(-7).toString();
  return end.includes('%%EOF');
}

/**
 * Get PDF file size in KB
 */
export function getPDFSizeKB(buffer: Buffer): number {
  return buffer.length / 1024;
}

/**
 * Wait for a specified duration (for async operations)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clean test certificates directory
 */
export function cleanTestCertificates(): void {
  const certDir = path.join(__dirname, '../../test_certificates');
  if (fs.existsSync(certDir)) {
    const files = fs.readdirSync(certDir);
    files.forEach((file) => {
      fs.unlinkSync(path.join(certDir, file));
    });
  }
}

/**
 * Create test certificates directory if it doesn't exist
 */
export function ensureTestCertificatesDir(): void {
  const certDir = path.join(__dirname, '../../test_certificates');
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }
}

/**
 * Mock express request for testing
 */
export function mockRequest(options: {
  body?: any;
  params?: any;
  query?: any;
  headers?: any;
  user?: any;
}) {
  return {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
    user: options.user,
    get: (header: string) => options.headers?.[header],
    ip: '127.0.0.1',
  };
}

/**
 * Mock express response for testing
 */
export function mockResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.sendStatus = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
}

/**
 * Extract error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
