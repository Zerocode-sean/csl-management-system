"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFService = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const qrcode_1 = __importDefault(require("qrcode"));
const logger_1 = require("../utils/logger");
class PDFService {
    /**
     * Generate QR code as Data URL
     * QR code contains link to verification portal
     */
    static async generateQRCode(cslNumber) {
        try {
            const publicUrl = process.env['PUBLIC_URL'] || 'http://localhost:3000';
            const verificationUrl = `${publicUrl}/verify?csl=${cslNumber}`;
            // Generate QR code as Data URL (base64 image)
            const qrDataURL = await qrcode_1.default.toDataURL(verificationUrl, {
                errorCorrectionLevel: 'H',
                type: 'image/png',
                width: 200,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            });
            logger_1.logger.debug(`Generated QR code for CSL: ${cslNumber}`);
            return qrDataURL;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate QR code:', error);
            throw new Error('QR code generation failed');
        }
    }
    /**
     * Load and populate HTML template with certificate data
     */
    static async populateTemplate(data, qrCodeDataURL) {
        try {
            const templateContent = await fs.readFile(this.templatePath, 'utf-8');
            // Format issue date
            const issueDate = new Date(data.issue_date);
            const formattedDate = issueDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            // Get logo path - EMESA logo from logo folder
            let logoDataURL = '';
            try {
                // Read the EMESA logo file and convert to base64
                const logoBuffer = await fs.readFile(this.logoPath);
                const logoExt = path.extname(this.logoPath).toLowerCase();
                const mimeType = logoExt === '.png' ? 'image/png' : 'image/jpeg';
                logoDataURL = `data:${mimeType};base64,${logoBuffer.toString('base64')}`;
                logger_1.logger.debug('EMESA logo loaded successfully');
            }
            catch (logoError) {
                // Logo not found, log warning
                logger_1.logger.warn('EMESA logo file not found at:', this.logoPath);
                logoDataURL = ''; // Empty will hide logo
            }
            // Replace all placeholders
            let populatedHtml = templateContent
                .replace(/\{\{student_name\}\}/g, data.student_name)
                .replace(/\{\{course_name\}\}/g, data.course_name)
                .replace(/\{\{course_code\}\}/g, data.course_code)
                .replace(/\{\{csl_number\}\}/g, data.serial_number)
                .replace(/\{\{issue_date\}\}/g, formattedDate)
                .replace(/\{\{issuer_name\}\}/g, data.issued_by)
                .replace(/\{\{qr_code\}\}/g, qrCodeDataURL)
                .replace(/\{\{logo_path\}\}/g, logoDataURL);
            return populatedHtml;
        }
        catch (error) {
            logger_1.logger.error('Failed to populate template:', error);
            throw new Error('Template population failed');
        }
    }
    /**
     * Ensure certificates directory exists
     */
    static async ensureCertificatesDirectory() {
        try {
            await fs.mkdir(this.certificatesDir, { recursive: true });
        }
        catch (error) {
            logger_1.logger.error('Failed to create certificates directory:', error);
            throw new Error('Directory creation failed');
        }
    }
    /**
     * Generate certificate PDF
     * @param data Certificate data to populate template
     * @returns PDF generation result with file path
     */
    static async generateCertificatePDF(data) {
        let browser = null;
        try {
            logger_1.logger.info(`Starting PDF generation for CSL: ${data.serial_number}`);
            // Ensure certificates directory exists
            await this.ensureCertificatesDirectory();
            // Generate QR code
            const qrCodeDataURL = await this.generateQRCode(data.serial_number);
            // Populate HTML template
            const populatedHtml = await this.populateTemplate(data, qrCodeDataURL);
            // Launch Puppeteer
            browser = await puppeteer_1.default.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            // Set content with proper base URL for loading resources
            await page.setContent(populatedHtml, {
                waitUntil: 'networkidle0'
            });
            // Generate PDF with A4 landscape settings
            const pdfFileName = `${data.serial_number}.pdf`;
            const pdfFilePath = path.join(this.certificatesDir, pdfFileName);
            await page.pdf({
                path: pdfFilePath,
                format: 'A4',
                landscape: true,
                printBackground: true,
                preferCSSPageSize: true,
                margin: {
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0
                }
            });
            await browser.close();
            browser = null;
            logger_1.logger.info(`PDF generated successfully: ${pdfFilePath}`);
            return {
                success: true,
                filePath: pdfFilePath
            };
        }
        catch (error) {
            logger_1.logger.error('PDF generation failed:', error);
            // Cleanup browser if still running
            if (browser) {
                try {
                    await browser.close();
                }
                catch (closeError) {
                    logger_1.logger.error('Failed to close browser:', closeError);
                }
            }
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Get PDF file path for a CSL number
     * @param cslNumber CSL certificate number
     * @returns Full path to PDF file
     */
    static getPDFPath(cslNumber) {
        return path.join(this.certificatesDir, `${cslNumber}.pdf`);
    }
    /**
     * Check if PDF exists for a CSL number
     * @param cslNumber CSL certificate number
     * @returns Promise<boolean>
     */
    static async pdfExists(cslNumber) {
        try {
            const pdfPath = this.getPDFPath(cslNumber);
            await fs.access(pdfPath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Delete PDF file
     * @param cslNumber CSL certificate number
     */
    static async deletePDF(cslNumber) {
        try {
            const pdfPath = this.getPDFPath(cslNumber);
            await fs.unlink(pdfPath);
            logger_1.logger.info(`Deleted PDF: ${pdfPath}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to delete PDF for ${cslNumber}:`, error);
            throw error;
        }
    }
}
exports.PDFService = PDFService;
PDFService.templatePath = path.join(__dirname, '..', 'templates', 'certificate-emesa.html');
PDFService.certificatesDir = path.join(__dirname, '..', '..', 'certificates');
PDFService.logoPath = path.join(__dirname, '..', '..', '..', 'logo', 'WhatsApp Image 2025-11-21 at 10.39.29_f08a778d.jpg');
