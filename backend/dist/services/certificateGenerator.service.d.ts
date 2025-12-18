/**
 * Certificate Generator Service
 * Generates PDF certificates with QR codes and manages database transactions
 * According to cloud.md specification (lines 330-588)
 */
export declare class CertificateGeneratorService {
    /**
     * Generate certificate HTML template
     * Reads from certificate.html file and replaces placeholders
     */
    private static generateHTML;
    /**
     * Generate certificate PDF
     * According to cloud.md lines 485-586
     *
     * @param studentId - Database ID of the student
     * @param courseId - Database ID of the course
     * @param adminId - Database ID of the admin issuing the certificate
     * @returns Object containing cslNumber and pdfPath
     */
    static generateCertificate(studentId: number, courseId: number, adminId: number): Promise<{
        cslNumber: string;
        pdfPath: string;
    }>;
    /**
     * Get PDF path for a certificate
     * @param cslNumber - CSL certificate number
     * @returns Full path to PDF file
     */
    static getPDFPath(cslNumber: string): string;
    /**
     * Check if PDF exists for a certificate
     * @param cslNumber - CSL certificate number
     * @returns boolean indicating if PDF exists
     */
    static pdfExists(cslNumber: string): boolean;
}
//# sourceMappingURL=certificateGenerator.service.d.ts.map