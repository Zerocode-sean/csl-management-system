import puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import QRCode from 'qrcode';
import { logger } from '../utils/logger';

interface CertificateData {
  student_name: string;
  course_name: string;
  course_code: string;
  serial_number: string; // CSL number
  issue_date: string;
  duration: number;
  issued_by: string;
}

interface PDFGenerationResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export class PDFService {
  private static templatePath = path.join(__dirname, '..', 'templates', 'certificate-emesa.html');
  private static certificatesDir = path.join(__dirname, '..', '..', 'certificates');
  private static logoPath = path.join(__dirname, '..', '..', '..', 'logo', 'WhatsApp Image 2025-11-21 at 10.39.29_f08a778d.jpg');

  /**
   * Generate QR code as Data URL
   * QR code contains link to verification portal
   */
  private static async generateQRCode(cslNumber: string): Promise<string> {
    try {
      const publicUrl = process.env['PUBLIC_URL'] || 'http://localhost:3000';
      const verificationUrl = `${publicUrl}/verify?csl=${cslNumber}`;
      
      // Generate QR code as Data URL (base64 image)
      const qrDataURL = await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      logger.debug(`Generated QR code for CSL: ${cslNumber}`);
      return qrDataURL;
    } catch (error) {
      logger.error('Failed to generate QR code:', error);
      throw new Error('QR code generation failed');
    }
  }

  /**
   * Load and populate HTML template with certificate data
   */
  private static async populateTemplate(data: CertificateData, qrCodeDataURL: string): Promise<string> {
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
        logger.debug('EMESA logo loaded successfully');
      } catch (logoError) {
        // Logo not found, log warning
        logger.warn('EMESA logo file not found at:', this.logoPath);
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
    } catch (error) {
      logger.error('Failed to populate template:', error);
      throw new Error('Template population failed');
    }
  }

  /**
   * Ensure certificates directory exists
   */
  private static async ensureCertificatesDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.certificatesDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create certificates directory:', error);
      throw new Error('Directory creation failed');
    }
  }

  /**
   * Generate certificate PDF
   * @param data Certificate data to populate template
   * @returns PDF generation result with file path
   */
  static async generateCertificatePDF(data: CertificateData): Promise<PDFGenerationResult> {
    let browser = null;

    try {
      logger.info(`Starting PDF generation for CSL: ${data.serial_number}`);

      // Ensure certificates directory exists
      await this.ensureCertificatesDirectory();

      // Generate QR code
      const qrCodeDataURL = await this.generateQRCode(data.serial_number);

      // Populate HTML template
      const populatedHtml = await this.populateTemplate(data, qrCodeDataURL);

      // Launch Puppeteer
      browser = await puppeteer.launch({
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

      logger.info(`PDF generated successfully: ${pdfFilePath}`);

      return {
        success: true,
        filePath: pdfFilePath
      };
    } catch (error) {
      logger.error('PDF generation failed:', error);
      
      // Cleanup browser if still running
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          logger.error('Failed to close browser:', closeError);
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
  static getPDFPath(cslNumber: string): string {
    return path.join(this.certificatesDir, `${cslNumber}.pdf`);
  }

  /**
   * Check if PDF exists for a CSL number
   * @param cslNumber CSL certificate number
   * @returns Promise<boolean>
   */
  static async pdfExists(cslNumber: string): Promise<boolean> {
    try {
      const pdfPath = this.getPDFPath(cslNumber);
      await fs.access(pdfPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete PDF file
   * @param cslNumber CSL certificate number
   */
  static async deletePDF(cslNumber: string): Promise<void> {
    try {
      const pdfPath = this.getPDFPath(cslNumber);
      await fs.unlink(pdfPath);
      logger.info(`Deleted PDF: ${pdfPath}`);
    } catch (error) {
      logger.error(`Failed to delete PDF for ${cslNumber}:`, error);
      throw error;
    }
  }
}
