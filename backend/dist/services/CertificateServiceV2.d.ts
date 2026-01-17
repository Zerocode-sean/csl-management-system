import { IssueCertificateDTO, CertificateVerificationResult, CertificateSearchFilter, PaginationOptions, CertificateStatus } from '../types/models';
/**
 * Enhanced Certificate Service
 * Handles certificate business logic and orchestrates repository operations
 */
export declare class CertificateServiceV2 {
    private studentRepo;
    private courseRepo;
    private certificateRepo;
    constructor();
    /**
     * Issue a new certificate
     */
    issueCertificate(data: IssueCertificateDTO, issuedBy: number): Promise<import("../types/models").Certificate>;
    /**
     * Verify certificate by CSL number
     */
    verifyCertificate(cslNumber: string): Promise<CertificateVerificationResult>;
    /**
     * Get certificate details with student and course info
     */
    getCertificateDetails(id: number): Promise<{
        student: {
            name: string;
            student_id: string;
            email: string;
        } | null;
        course: {
            name: string;
            code: string;
            category: string;
        } | null;
        id: number;
        certificate_number: string;
        csl_number: string;
        student_id: number;
        course_id: number;
        issue_date: Date;
        completion_date: Date;
        grade?: string;
        gpa?: number;
        status: CertificateStatus;
        issued_by: number;
        verification_hash: string;
        metadata?: any;
        created_at: Date;
        updated_at: Date;
    }>;
    /**
     * Search certificates
     */
    searchCertificates(filters?: CertificateSearchFilter, pagination?: PaginationOptions): Promise<import("../types/models").PaginatedResponse<any>>;
    /**
     * Get certificates for a student
     */
    getStudentCertificates(studentId: number): Promise<any[]>;
    /**
     * Get certificates for a course
     */
    getCourseCertificates(courseId: number): Promise<any[]>;
    /**
     * Revoke certificate
     */
    revokeCertificate(id: number, revokedBy: number): Promise<import("../types/models").Certificate>;
    /**
     * Get certificate statistics
     */
    getCertificateStatistics(): Promise<{
        total: number;
        by_status: {
            status: string;
            count: number;
        }[];
        recent_issued: number;
    }>;
}
//# sourceMappingURL=CertificateServiceV2.d.ts.map