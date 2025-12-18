export interface CertificateData {
    student_id: string;
    course_id: string;
    issued_by: string;
}
export interface CSLComponents {
    year: string;
    courseCode: string;
    sequential: string;
    hash: string;
    fullCSL: string;
}
export declare class CertificateService {
    /**
     * Generate CSL number in format: YYYY-CC-NNNN-VVVVVV
     */
    static generateCSL(certificateData: CertificateData): Promise<CSLComponents>;
    /**
     * Get next sequential number for the year and course
     */
    private static getNextSequentialNumber;
    /**
     * Generate cryptographic verification hash
     */
    private static generateVerificationHash;
    /**
     * Validate CSL format
     */
    static validateCSLFormat(cslNumber: string): boolean;
    /**
     * Parse CSL components
     */
    static parseCSL(cslNumber: string): CSLComponents | null;
    /**
     * Generate QR Code for certificate verification
     */
    static generateQRCode(cslNumber: string): Promise<string>;
    /**
     * Generate PDF certificate
     */
    static generatePDF(certificateDetails: any): Promise<string>;
    /**
     * Get certificate file path
     */
    static getCertificatePath(cslNumber: string): string;
    /**
     * Verify certificate authenticity
     */
    static verifyCertificate(cslNumber: string): Promise<{
        valid: boolean;
        certificate?: any;
        message: string;
    }>;
    /**
     * Issue a new certificate
     */
    static issueCertificate(certificateData: CertificateData): Promise<any>;
    /**
     * Revoke a certificate
     */
    static revokeCertificate(cslNumber: string, revokedBy: string, reason?: string): Promise<any>;
    /**
     * Get certificates with filters and pagination
     */
    static getCertificates(params: {
        page?: number;
        limit?: number;
        status?: string;
        courseId?: string;
        studentId?: string;
        search?: string;
    }): Promise<{
        certificates: any[];
        total: number;
        page: number;
        limit: number;
    }>;
}
//# sourceMappingURL=certificateService.d.ts.map