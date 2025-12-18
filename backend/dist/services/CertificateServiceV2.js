"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificateServiceV2 = void 0;
const StudentRepository_1 = require("../repositories/StudentRepository");
const CourseRepository_1 = require("../repositories/CourseRepository");
const CertificateRepository_1 = require("../repositories/CertificateRepository");
const certificateUtils_1 = require("../utils/certificateUtils");
const logger_1 = require("../utils/logger");
/**
 * Enhanced Certificate Service
 * Handles certificate business logic and orchestrates repository operations
 */
class CertificateServiceV2 {
    constructor() {
        this.studentRepo = new StudentRepository_1.StudentRepository();
        this.courseRepo = new CourseRepository_1.CourseRepository();
        this.certificateRepo = new CertificateRepository_1.CertificateRepository();
    }
    /**
     * Issue a new certificate
     */
    async issueCertificate(data, issuedBy) {
        // Validate input data
        const validation = (0, certificateUtils_1.validateCertificateData)(data);
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        // Check if student exists
        const student = await this.studentRepo.findById(data.student_id);
        if (!student) {
            throw new Error('Student not found');
        }
        // Check if course exists
        const course = await this.courseRepo.findById(data.course_id);
        if (!course) {
            throw new Error('Course not found');
        }
        // Check if certificate already exists for this student and course
        const existingCert = await this.certificateRepo.existsForStudentCourse(data.student_id, data.course_id);
        if (existingCert) {
            throw new Error('Certificate already exists for this student and course');
        }
        // Issue the certificate
        const certificate = await this.certificateRepo.issue(data, issuedBy);
        logger_1.logger.info('Certificate issued successfully', {
            csl_number: certificate.csl_number,
            student: `${student.first_name} ${student.last_name}`,
            course: course.course_name
        });
        return certificate;
    }
    /**
     * Verify certificate by CSL number
     */
    async verifyCertificate(cslNumber) {
        return await this.certificateRepo.verify(cslNumber);
    }
    /**
     * Get certificate details with student and course info
     */
    async getCertificateDetails(id) {
        const certificate = await this.certificateRepo.findById(id);
        if (!certificate) {
            throw new Error('Certificate not found');
        }
        const student = await this.studentRepo.findById(certificate.student_id);
        const course = await this.courseRepo.findById(certificate.course_id);
        return {
            ...certificate,
            student: student ? {
                name: `${student.first_name} ${student.last_name}`,
                student_id: student.student_id,
                email: student.email
            } : null,
            course: course ? {
                name: course.course_name,
                code: course.course_code,
                category: course.category
            } : null
        };
    }
    /**
     * Search certificates
     */
    async searchCertificates(filters = {}, pagination = {}) {
        return await this.certificateRepo.search(filters, pagination);
    }
    /**
     * Get certificates for a student
     */
    async getStudentCertificates(studentId) {
        const student = await this.studentRepo.findById(studentId);
        if (!student) {
            throw new Error('Student not found');
        }
        return await this.certificateRepo.findByStudent(studentId);
    }
    /**
     * Get certificates for a course
     */
    async getCourseCertificates(courseId) {
        const course = await this.courseRepo.findById(courseId);
        if (!course) {
            throw new Error('Course not found');
        }
        return await this.certificateRepo.findByCourse(courseId);
    }
    /**
     * Revoke certificate
     */
    async revokeCertificate(id, revokedBy) {
        const certificate = await this.certificateRepo.findById(id);
        if (!certificate) {
            throw new Error('Certificate not found');
        }
        if (certificate.status === 'revoked') {
            throw new Error('Certificate is already revoked');
        }
        const updatedCert = await this.certificateRepo.updateStatus(id, 'revoked', revokedBy);
        logger_1.logger.info('Certificate revoked', {
            csl_number: certificate.csl_number,
            revoked_by: revokedBy
        });
        return updatedCert;
    }
    /**
     * Get certificate statistics
     */
    async getCertificateStatistics() {
        return await this.certificateRepo.getStatistics();
    }
}
exports.CertificateServiceV2 = CertificateServiceV2;
