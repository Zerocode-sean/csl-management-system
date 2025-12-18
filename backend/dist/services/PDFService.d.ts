interface CertificateData {
    student_name: string;
    course_name: string;
    course_code: string;
    serial_number: string;
    issue_date: string;
    duration: number;
    issued_by: string;
}
interface PDFGenerationResult {
    success: boolean;
    filePath?: string;
    error?: string;
}
export declare class PDFService {
    private static templatePath;
    private static certificatesDir;
    private static logoPath;
    /**
     * Generate QR code as Data URL
     * QR code contains link to verification portal
     */
    private static generateQRCode;
    /**
     * Load and populate HTML template with certificate data
     */
    private static populateTemplate;
    /**
     * Ensure certificates directory exists
     */
    private static ensureCertificatesDirectory;
    /**
     * Generate certificate PDF
     * @param data Certificate data to populate template
     * @returns PDF generation result with file path
     */
    static generateCertificatePDF(data: CertificateData): Promise<PDFGenerationResult>;
    /**
     * Get PDF file path for a CSL number
     * @param cslNumber CSL certificate number
     * @returns Full path to PDF file
     */
    static getPDFPath(cslNumber: string): string;
    /**
     * Check if PDF exists for a CSL number
     * @param cslNumber CSL certificate number
     * @returns Promise<boolean>
     */
    static pdfExists(cslNumber: string): Promise<boolean>;
    /**
     * Delete PDF file
     * @param cslNumber CSL certificate number
     */
    static deletePDF(cslNumber: string): Promise<void>;
}
export {};
//# sourceMappingURL=PDFService.d.ts.map