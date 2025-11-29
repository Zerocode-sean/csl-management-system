import { Certificate, IssueCertificateDTO, CertificateSearchFilter, CertificateVerificationResult, PaginationOptions, PaginatedResponse, CertificateStatus } from '../types/models';
export declare class CertificateRepository {
    /**
     * Issue a new certificate
     */
    issue(data: IssueCertificateDTO, issuedBy: number): Promise<Certificate>;
    /**
     * Find certificate by ID
     */
    findById(id: number): Promise<Certificate | null>;
    /**
     * Find certificate by CSL number
     */
    findByCSLNumber(cslNumber: string): Promise<Certificate | null>;
    /**
     * Verify certificate with full details
     */
    verify(cslNumber: string): Promise<CertificateVerificationResult>;
    /**
     * Update certificate status
     */
    updateStatus(id: number, status: CertificateStatus, updatedBy: number): Promise<Certificate>;
    /**
     * Search certificates with pagination
     */
    search(filters?: CertificateSearchFilter, pagination?: PaginationOptions): Promise<PaginatedResponse<any>>;
    /**
     * Get certificates by student
     */
    findByStudent(studentId: number): Promise<any[]>;
    /**
     * Get certificates by course
     */
    findByCourse(courseId: number): Promise<any[]>;
    /**
     * Check if certificate exists for student and course
     */
    existsForStudentCourse(studentId: number, courseId: number): Promise<boolean>;
    /**
     * Get certificate statistics
     */
    getStatistics(): Promise<{
        total: number;
        by_status: {
            status: string;
            count: number;
        }[];
        recent_issued: number;
    }>;
}
//# sourceMappingURL=CertificateRepository.d.ts.map