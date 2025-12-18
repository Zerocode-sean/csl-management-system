"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificateGeneratorService = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const qrcode_1 = __importDefault(require("qrcode"));
const connection_1 = require("../database/connection");
const cslGenerator_service_1 = require("./cslGenerator.service");
const logger_1 = require("../utils/logger");
/**
 * Certificate Generator Service
 * Generates PDF certificates with QR codes and manages database transactions
 * According to cloud.md specification (lines 330-588)
 */
class CertificateGeneratorService {
    /**
     * Generate certificate HTML template
     * Reads from certificate.html file and replaces placeholders
     */
    static async generateHTML(data) {
        // Try primary template path, but fall back to legacy template(s) if needed
        const primaryTemplate = path_1.default.join(process.cwd(), 'src/templates/certificate.html');
        const altTemplate1 = path_1.default.join(process.cwd(), 'backend', 'templates', 'certificate-emesa.html');
        const altTemplate2 = path_1.default.join(process.cwd(), 'backend', 'templates', 'certificate_template_new.html');
        let templatePath = primaryTemplate;
        if (!fs_1.default.existsSync(templatePath)) {
            if (fs_1.default.existsSync(altTemplate1)) {
                templatePath = altTemplate1;
            }
            else if (fs_1.default.existsSync(altTemplate2)) {
                templatePath = altTemplate2;
            }
        }
        logger_1.logger.info(`Reading template from: ${templatePath}`);
        // Read the template file
        let template = fs_1.default.readFileSync(templatePath, 'utf-8');
        logger_1.logger.info('Template loaded successfully, replacing placeholders...');
        // Get logo as base64 for embedding. Try a few likely locations so container/host path differences don't break rendering.
        const candidateLogoNames = [
            'WhatsApp Image 2025-11-21 at 10.39.29_f08a778d.jpg',
            'logo.jpg',
            'logo.png'
        ];
        const candidateLogoPaths = [
            path_1.default.join(process.cwd(), 'logo'),
            path_1.default.join(__dirname, '../../logo'),
            path_1.default.join(process.cwd(), '..', 'logo')
        ];
        let logoDataUrl = '';
        let foundLogoPath = '';
        for (const base of candidateLogoPaths) {
            for (const name of candidateLogoNames) {
                const p = path_1.default.join(base, name);
                if (fs_1.default.existsSync(p)) {
                    foundLogoPath = p;
                    break;
                }
            }
            if (foundLogoPath)
                break;
        }
        if (foundLogoPath) {
            try {
                const logoBuffer = fs_1.default.readFileSync(foundLogoPath);
                const ext = path_1.default.extname(foundLogoPath).toLowerCase();
                const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
                logoDataUrl = `data:${mime};base64,${logoBuffer.toString('base64')}`;
                logger_1.logger.info('Logo loaded successfully from: ' + foundLogoPath);
            }
            catch (err) {
                logger_1.logger.warn('Failed to read logo file at: ' + foundLogoPath, { error: err });
            }
        }
        else {
            logger_1.logger.warn('Logo file not found in any candidate path');
        }
        // Replace all placeholders. Accept both upper- and lower-case logo placeholders for backwards compatibility.
        template = template
            .replace(/{{CSL_NUMBER}}/g, data.cslNumber)
            .replace(/{{STUDENT_NAME}}/g, data.studentName)
            .replace(/{{COURSE_NAME}}/g, data.courseName)
            .replace(/{{COURSE_CODE}}/g, data.courseName) // Using courseName as placeholder for technologies
            .replace(/{{COMPLETION_DATE}}/g, data.completionDate)
            .replace(/{{ISSUE_DATE}}/g, data.issueDate)
            .replace(/{{ISSUED_BY}}/g, data.directorName)
            .replace(/{{QR_CODE}}/g, data.qrCodeDataUrl)
            .replace(/{{STUDENT_ID}}/g, '') // Not available in current data structure
            .replace(/{{LOGO_URL}}/g, logoDataUrl)
            .replace(/{{logo_path}}/g, logoDataUrl);
        logger_1.logger.info('All placeholders replaced successfully');
        return template;
    }
    /**
     * Generate certificate PDF
     * According to cloud.md lines 485-586
     *
     * @param studentId - Database ID of the student
     * @param courseId - Database ID of the course
     * @param adminId - Database ID of the admin issuing the certificate
     * @returns Object containing cslNumber and pdfPath
     */
    static async generateCertificate(studentId, courseId, adminId) {
        const pool = (0, connection_1.getPool)();
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            // Get student and course details
            const studentResult = await client.query('SELECT * FROM students WHERE student_id = $1', [studentId]);
            const courseResult = await client.query('SELECT * FROM courses WHERE course_id = $1', [courseId]);
            if (studentResult.rows.length === 0 || courseResult.rows.length === 0) {
                throw new Error('Student or course not found');
            }
            const student = studentResult.rows[0];
            const course = courseResult.rows[0];
            // Check for existing certificate
            const existingCert = await client.query('SELECT csl_number FROM certificates WHERE student_id = $1 AND course_id = $2 AND status = $3', [studentId, courseId, 'active']);
            if (existingCert.rows.length > 0) {
                throw new Error('Certificate already exists for this student and course');
            }
            // Generate CSL number
            const cslNumber = await cslGenerator_service_1.CSLGeneratorService.generateCSLNumber(studentId, courseId);
            // Generate QR code
            const publicUrl = process.env['PUBLIC_URL'] || 'http://localhost:3000';
            const verificationUrl = `${publicUrl}/verify/${cslNumber}`;
            const qrCodeDataUrl = await qrcode_1.default.toDataURL(verificationUrl);
            // Prepare certificate data
            const certificateData = {
                studentName: student.name.toUpperCase(),
                courseName: course.title,
                completionDate: new Date().toLocaleDateString('en-US'),
                issueDate: new Date().toLocaleDateString('en-US'),
                cslNumber: cslNumber,
                directorName: 'CPA EMELDA NYONGESA',
                qrCodeDataUrl: qrCodeDataUrl
            };
            // Generate PDF
            const html = await this.generateHTML(certificateData);
            const launchOptions = {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--ignore-certificate-errors'
                ]
            };
            if (process.env['PUPPETEER_EXECUTABLE_PATH']) {
                launchOptions.executablePath = process.env['PUPPETEER_EXECUTABLE_PATH'];
            }
            const browser = await puppeteer_1.default.launch(launchOptions);
            const page = await browser.newPage();
            // Use 'domcontentloaded' instead of 'networkidle0' to avoid hanging on external resources
            await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });
            const certificatesDir = path_1.default.join(__dirname, '../../certificates');
            if (!fs_1.default.existsSync(certificatesDir)) {
                fs_1.default.mkdirSync(certificatesDir, { recursive: true });
            }
            const pdfFileName = `${cslNumber}.pdf`;
            const pdfPath = path_1.default.join(certificatesDir, pdfFileName);
            await page.pdf({
                path: pdfPath,
                format: 'A4',
                landscape: true,
                printBackground: true
            });
            await browser.close();
            // Save to database with verification hash
            const crypto = require('crypto');
            const SECRET_PEPPER = process.env['CSL_SECRET_PEPPER'] || 'change-this-in-production';
            const fullHash = crypto
                .createHash('sha256')
                .update(`${cslNumber}-${studentId}-${SECRET_PEPPER}`)
                .digest('hex');
            await client.query(`INSERT INTO certificates (
          csl_number, student_id, course_id, issued_by_admin_id, status
        ) VALUES ($1, $2, $3, $4, 'active')`, [cslNumber, studentId, courseId, adminId]);
            // Update student_courses
            await client.query(`UPDATE student_courses
         SET status = 'completed', completion_date = $1
         WHERE student_id = $2 AND course_id = $3`, [new Date(), studentId, courseId]);
            // Audit log
            await client.query(`INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, new_values)
         VALUES ($1, $2, $3, $4, $5)`, [
                adminId,
                'CREATE',
                'certificate',
                cslNumber,
                JSON.stringify({
                    csl_number: cslNumber,
                    student_id: studentId,
                    course_id: courseId
                })
            ]);
            await client.query('COMMIT');
            logger_1.logger.info('Certificate generated successfully', {
                cslNumber,
                studentId,
                courseId,
                adminId,
                pdfPath
            });
            return { cslNumber, pdfPath };
        }
        catch (error) {
            await client.query('ROLLBACK');
            logger_1.logger.error('Failed to generate certificate', {
                error,
                studentId,
                courseId,
                adminId
            });
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Get PDF path for a certificate
     * @param cslNumber - CSL certificate number
     * @returns Full path to PDF file
     */
    static getPDFPath(cslNumber) {
        const certificatesDir = path_1.default.join(__dirname, '../../certificates');
        return path_1.default.join(certificatesDir, `${cslNumber}.pdf`);
    }
    /**
     * Check if PDF exists for a certificate
     * @param cslNumber - CSL certificate number
     * @returns boolean indicating if PDF exists
     */
    static pdfExists(cslNumber) {
        const pdfPath = this.getPDFPath(cslNumber);
        return fs_1.default.existsSync(pdfPath);
    }
}
exports.CertificateGeneratorService = CertificateGeneratorService;
