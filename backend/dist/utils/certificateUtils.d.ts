/**
 * Generate unique CSL number
 * Format: CSL-YYYY-XXXXXX (e.g., CSL-2025-AB1234)
 */
export declare const generateCSLNumber: () => Promise<string>;
/**
 * Generate verification hash for certificate integrity
 */
export declare const generateVerificationHash: (cslNumber: string, studentId: number, courseId: number) => string;
/**
 * Validate CSL number format
 */
export declare const validateCSLNumber: (cslNumber: string) => boolean;
/**
 * Generate certificate PDF metadata
 */
export declare const generateCertificateMetadata: (studentName: string, courseName: string, completionDate: Date, grade?: string) => {
    studentName: string;
    courseName: string;
    completionDate: string | undefined;
    grade: string;
    issueDate: string | undefined;
    version: string;
};
/**
 * Validate certificate data before issuance
 */
export declare const validateCertificateData: (data: {
    student_id: number;
    course_id: number;
    completion_date: string;
    grade?: string;
    gpa?: number;
}) => {
    valid: boolean;
    errors: string[];
};
/**
 * Format certificate display data
 */
export declare const formatCertificateForDisplay: (certificate: any) => {
    id: any;
    csl_number: any;
    certificate_number: any;
    student: {
        name: string;
        student_id: any;
    };
    course: {
        name: any;
        code: any;
    };
    dates: {
        issue_date: any;
        completion_date: any;
    };
    grade: any;
    gpa: any;
    status: any;
    issued_by: any;
};
/**
 * Generate QR code data for certificate
 */
export declare const generateQRCodeData: (cslNumber: string, baseUrl?: string) => string;
/**
 * Calculate certificate statistics
 */
export declare const calculateCertificateStats: (certificates: any[]) => {
    total: number;
    byStatus: Record<string, number>;
    byGrade: Record<string, number>;
    byMonth: Record<string, number>;
    averageGPA: number;
};
/**
 * Sanitize certificate search query
 */
export declare const sanitizeSearchQuery: (query: string) => string;
/**
 * Check if certificate can be modified
 */
export declare const canModifyCertificate: (certificate: any, userRole: string) => boolean;
//# sourceMappingURL=certificateUtils.d.ts.map