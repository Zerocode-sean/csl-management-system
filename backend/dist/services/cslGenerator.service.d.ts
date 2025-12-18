/**
 * CSL Generator Service
 * Generates and verifies CSL numbers according to cloud.md specification
 * Format: YYYY-CC-NNNN-VVVVVV
 */
export declare class CSLGeneratorService {
    /**
     * Generate a unique CSL number
     * Format: YYYY-CC-NNNN-VVVVVV
     * Example: 2025-KBA-0042-9F8C2B
     *
     * @param studentId - Database ID of the student
     * @param courseId - Database ID of the course
     * @returns Promise<string> - The generated CSL number
     */
    static generateCSLNumber(studentId: number, courseId: number): Promise<string>;
    /**
     * Verify if a CSL number is valid
     * Checks both format and cryptographic authenticity
     *
     * @param cslNumber - CSL number to verify
     * @returns Promise<boolean> - True if valid, false otherwise
     */
    static verifyCSLNumber(cslNumber: string): Promise<boolean>;
    /**
     * Parse CSL number into components
     *
     * @param cslNumber - CSL number to parse
     * @returns Object with year, courseCode, sequence, and hash, or null if invalid
     */
    static parseCSL(cslNumber: string): {
        year: string;
        courseCode: string;
        sequence: string;
        hash: string;
    } | null;
    /**
     * Validate CSL format without database lookup
     * Quick validation for format only
     *
     * @param cslNumber - CSL number to validate
     * @returns boolean - True if format is valid
     */
    static validateCSLFormat(cslNumber: string): boolean;
}
//# sourceMappingURL=cslGenerator.service.d.ts.map