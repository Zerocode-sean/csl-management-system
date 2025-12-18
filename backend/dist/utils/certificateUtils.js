"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.canModifyCertificate = exports.sanitizeSearchQuery = exports.calculateCertificateStats = exports.generateQRCodeData = exports.formatCertificateForDisplay = exports.validateCertificateData = exports.generateCertificateMetadata = exports.validateCSLNumber = exports.generateVerificationHash = exports.generateCSLNumber = void 0;
const crypto_1 = __importDefault(require("crypto"));
const connection_1 = require("../database/connection");
/**
 * Generate unique CSL number
 * Format: CSL-YYYY-XXXXXX (e.g., CSL-2025-AB1234)
 */
const generateCSLNumber = async () => {
    const year = new Date().getFullYear();
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Generate random 6-character alphanumeric string
        const suffix = crypto_1.default.randomBytes(3).toString('hex').toUpperCase();
        const cslNumber = `CSL-${year}-${suffix}`;
        // Check if this CSL number already exists
        try {
            const result = await (0, connection_1.query)('SELECT 1 FROM certificates WHERE csl_number = $1', [cslNumber]);
            if (result.rows.length === 0) {
                return cslNumber;
            }
        }
        catch (error) {
            // If we can't check the database, still return the number
            // The database constraint will catch duplicates
            return cslNumber;
        }
    }
    // Fallback with timestamp if all attempts failed
    const timestamp = Date.now().toString(36).toUpperCase();
    return `CSL-${year}-${timestamp}`;
};
exports.generateCSLNumber = generateCSLNumber;
/**
 * Generate verification hash for certificate integrity
 */
const generateVerificationHash = (cslNumber, studentId, courseId) => {
    const data = `${cslNumber}-${studentId}-${courseId}-${Date.now()}`;
    return crypto_1.default.createHash('sha256').update(data).digest('hex');
};
exports.generateVerificationHash = generateVerificationHash;
/**
 * Validate CSL number format
 */
const validateCSLNumber = (cslNumber) => {
    const pattern = /^CSL-\d{4}-[A-Z0-9]{6}$/;
    return pattern.test(cslNumber);
};
exports.validateCSLNumber = validateCSLNumber;
/**
 * Generate certificate PDF metadata
 */
const generateCertificateMetadata = (studentName, courseName, completionDate, grade) => {
    return {
        studentName,
        courseName,
        completionDate: completionDate.toISOString().split('T')[0],
        grade: grade || 'Pass',
        issueDate: new Date().toISOString().split('T')[0],
        version: '1.0'
    };
};
exports.generateCertificateMetadata = generateCertificateMetadata;
/**
 * Validate certificate data before issuance
 */
const validateCertificateData = (data) => {
    const errors = [];
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
    }
    else {
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
exports.validateCertificateData = validateCertificateData;
/**
 * Format certificate display data
 */
const formatCertificateForDisplay = (certificate) => {
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
exports.formatCertificateForDisplay = formatCertificateForDisplay;
/**
 * Generate QR code data for certificate
 */
const generateQRCodeData = (cslNumber, baseUrl = 'https://csl.emesa.edu') => {
    return `${baseUrl}/verify/${cslNumber}`;
};
exports.generateQRCodeData = generateQRCodeData;
/**
 * Calculate certificate statistics
 */
const calculateCertificateStats = (certificates) => {
    const stats = {
        total: certificates.length,
        byStatus: {},
        byGrade: {},
        byMonth: {},
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
exports.calculateCertificateStats = calculateCertificateStats;
/**
 * Sanitize certificate search query
 */
const sanitizeSearchQuery = (query) => {
    return query
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .substring(0, 100); // Limit length
};
exports.sanitizeSearchQuery = sanitizeSearchQuery;
/**
 * Check if certificate can be modified
 */
const canModifyCertificate = (certificate, userRole) => {
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
exports.canModifyCertificate = canModifyCertificate;
