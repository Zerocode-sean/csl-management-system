import crypto from 'crypto';
import { query } from '../database/connection';

/**
 * Generate unique CSL number
 * Format: CSL-YYYY-XXXXXX (e.g., CSL-2025-AB1234)
 */
export const generateCSLNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const maxAttempts = 10;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate random 6-character alphanumeric string
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const cslNumber = `CSL-${year}-${suffix}`;
    
    // Check if this CSL number already exists
    try {
      const result = await query('SELECT 1 FROM certificates WHERE csl_number = $1', [cslNumber]);
      if (result.rows.length === 0) {
        return cslNumber;
      }
    } catch (error) {
      // If we can't check the database, still return the number
      // The database constraint will catch duplicates
      return cslNumber;
    }
  }
  
  // Fallback with timestamp if all attempts failed
  const timestamp = Date.now().toString(36).toUpperCase();
  return `CSL-${year}-${timestamp}`;
};

/**
 * Generate verification hash for certificate integrity
 */
export const generateVerificationHash = (
  cslNumber: string, 
  studentId: number, 
  courseId: number
): string => {
  const data = `${cslNumber}-${studentId}-${courseId}-${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Validate CSL number format
 */
export const validateCSLNumber = (cslNumber: string): boolean => {
  const pattern = /^CSL-\d{4}-[A-Z0-9]{6}$/;
  return pattern.test(cslNumber);
};

/**
 * Generate certificate PDF metadata
 */
export const generateCertificateMetadata = (
  studentName: string,
  courseName: string,
  completionDate: Date,
  grade?: string
) => {
  return {
    studentName,
    courseName,
    completionDate: completionDate.toISOString().split('T')[0],
    grade: grade || 'Pass',
    issueDate: new Date().toISOString().split('T')[0],
    version: '1.0'
  };
};

/**
 * Validate certificate data before issuance
 */
export const validateCertificateData = (data: {
  student_id: number;
  course_id: number;
  completion_date: string;
  grade?: string;
  gpa?: number;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate student ID
  if (!data.student_id || data.student_id <= 0) {
    errors.push('Valid student ID is required');
  }

  // Validate course ID
  if (!data.course_id || data.course_id <= 0) {
    errors.push('Valid course ID is required');
  }

  // Validate completion date
  const completionDate = new Date(data.completion_date);
  if (isNaN(completionDate.getTime())) {
    errors.push('Valid completion date is required');
  } else {
    // Completion date should not be in the future
    if (completionDate > new Date()) {
      errors.push('Completion date cannot be in the future');
    }
    
    // Completion date should not be too old (e.g., more than 10 years)
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    if (completionDate < tenYearsAgo) {
      errors.push('Completion date cannot be more than 10 years ago');
    }
  }

  // Validate GPA if provided
  if (data.gpa !== undefined) {
    if (data.gpa < 0 || data.gpa > 4.0) {
      errors.push('GPA must be between 0 and 4.0');
    }
  }

  // Validate grade if provided
  if (data.grade) {
    const validGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'Pass', 'Fail', 'Incomplete'];
    if (!validGrades.includes(data.grade)) {
      errors.push('Invalid grade value');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Format certificate display data
 */
export const formatCertificateForDisplay = (certificate: any) => {
  return {
    id: certificate.id,
    csl_number: certificate.csl_number,
    certificate_number: certificate.certificate_number,
    student: {
      name: `${certificate.first_name} ${certificate.last_name}`,
      student_id: certificate.student_id
    },
    course: {
      name: certificate.course_name,
      code: certificate.course_code
    },
    dates: {
      issue_date: certificate.issue_date,
      completion_date: certificate.completion_date
    },
    grade: certificate.grade,
    gpa: certificate.gpa,
    status: certificate.status,
    issued_by: certificate.issued_by
  };
};

/**
 * Generate QR code data for certificate
 */
export const generateQRCodeData = (cslNumber: string, baseUrl: string = 'https://csl.emesa.edu'): string => {
  return `${baseUrl}/verify/${cslNumber}`;
};

/**
 * Calculate certificate statistics
 */
export const calculateCertificateStats = (certificates: any[]) => {
  const stats = {
    total: certificates.length,
    byStatus: {} as Record<string, number>,
    byGrade: {} as Record<string, number>,
    byMonth: {} as Record<string, number>,
    averageGPA: 0
  };

  let totalGPA = 0;
  let gpaCount = 0;

  certificates.forEach(cert => {
    // Count by status
    stats.byStatus[cert.status] = (stats.byStatus[cert.status] || 0) + 1;

    // Count by grade
    if (cert.grade) {
      stats.byGrade[cert.grade] = (stats.byGrade[cert.grade] || 0) + 1;
    }

    // Count by month
    const month = new Date(cert.issue_date).toISOString().substring(0, 7); // YYYY-MM
    stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;

    // Calculate average GPA
    if (cert.gpa) {
      totalGPA += cert.gpa;
      gpaCount++;
    }
  });

  stats.averageGPA = gpaCount > 0 ? Math.round((totalGPA / gpaCount) * 100) / 100 : 0;

  return stats;
};

/**
 * Sanitize certificate search query
 */
export const sanitizeSearchQuery = (query: string): string => {
  return query
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .substring(0, 100); // Limit length
};

/**
 * Check if certificate can be modified
 */
export const canModifyCertificate = (certificate: any, userRole: string): boolean => {
  // Only admins can modify certificates
  if (userRole !== 'admin') {
    return false;
  }

  // Cannot modify revoked certificates
  if (certificate.status === 'revoked') {
    return false;
  }

  // Cannot modify certificates older than 30 days (business rule)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  if (new Date(certificate.issue_date) < thirtyDaysAgo) {
    return false;
  }

  return true;
};
