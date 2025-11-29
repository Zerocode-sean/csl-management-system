import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { query as queryValidator, validationResult } from 'express-validator';
import { query } from '../database/connection';

const router = Router();

// All admin routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get admin dashboard data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  // Get overview statistics
  const overviewResult = await query(`
    SELECT 
      (SELECT COUNT(*) FROM students WHERE is_active = true) as active_students,
      (SELECT COUNT(*) FROM courses WHERE is_active = true) as active_courses,
      (SELECT COUNT(*) FROM certificates WHERE status = 'active') as active_certificates,
      (SELECT COUNT(*) FROM certificates WHERE DATE(issued_at) = CURRENT_DATE) as certificates_issued_today,
      (SELECT COUNT(*) FROM verification_logs WHERE DATE(verified_at) = CURRENT_DATE) as verifications_today
  `);

  // Get recent certificates
  const recentCertificatesResult = await query(`
    SELECT 
      c.certificate_id,
      c.csl_number,
      c.issued_at,
      s.name as student_name,
      course.course_name,
      course.course_code,
      admin.name as issuer_name
    FROM certificates c
    JOIN students s ON c.student_id = s.student_id
    JOIN courses course ON c.course_id = course.course_id
    JOIN admins admin ON c.issued_by = admin.admin_id
    ORDER BY c.issued_at DESC
    LIMIT 10
  `);

  // Get certificate issuance trend (last 30 days)
  const trendResult = await query(`
    SELECT 
      DATE(issued_at) as date,
      COUNT(*) as count
    FROM certificates 
    WHERE issued_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(issued_at)
    ORDER BY date ASC
  `);

  // Get verification statistics (last 7 days)
  const verificationStatsResult = await query(`
    SELECT 
      DATE(verified_at) as date,
      COUNT(*) as total_attempts,
      COUNT(*) FILTER (WHERE verification_result = true) as successful_verifications
    FROM verification_logs 
    WHERE verified_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY DATE(verified_at)
    ORDER BY date ASC
  `);

  // Get top courses by certificate count
  const topCoursesResult = await query(`
    SELECT 
      co.course_name,
      co.course_code,
      COUNT(c.certificate_id) as certificate_count
    FROM courses co
    LEFT JOIN certificates c ON co.course_id = c.course_id AND c.status = 'active'
    WHERE co.is_active = true
    GROUP BY co.course_id, co.course_name, co.course_code
    ORDER BY certificate_count DESC
    LIMIT 5
  `);

  res.json({
    success: true,
    data: {
      overview: overviewResult.rows[0],
      recent_certificates: recentCertificatesResult.rows,
      issuance_trend: trendResult.rows,
      verification_stats: verificationStatsResult.rows,
      top_courses: topCoursesResult.rows
    }
  });
}));

/**
 * @swagger
 * /admin/system-info:
 *   get:
 *     summary: Get system information
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System information
 */
router.get('/system-info', 
  authorizeRoles('super_admin'),
  asyncHandler(async (req, res) => {
    // Get database statistics
    const dbStatsResult = await query(`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes
      FROM pg_stat_user_tables
      ORDER BY tablename
    `);

    // Get system configuration
    const configResult = await query(`
      SELECT config_key, config_value, description, updated_at
      FROM system_config
      ORDER BY config_key
    `);

    res.json({
      success: true,
      data: {
        database_stats: dbStatsResult.rows,
        system_config: configResult.rows,
        server_info: {
          node_version: process.version,
          uptime: process.uptime(),
          memory_usage: process.memoryUsage(),
          environment: process.env['NODE_ENV'] || 'development'
        }
      }
    });
  })
);

/**
 * @swagger
 * /admin/reports:
 *   get:
 *     summary: Generate reports
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [certificates, students, courses, verifications, audit]
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: course_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Report data
 */
router.get('/reports',
  authorizeRoles('super_admin', 'admin'),
  [
    queryValidator('type').isIn(['certificates', 'students', 'courses', 'verifications', 'audit']).withMessage('Invalid report type'),
    queryValidator('start_date').optional().isDate().withMessage('Start date must be a valid date'),
    queryValidator('end_date').optional().isDate().withMessage('End date must be a valid date'),
    queryValidator('course_id').optional().isUUID().withMessage('Course ID must be a valid UUID')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400, errors.array().map((err: any) => ({
        field: err.param,
        message: err.msg
      })));
    }

    const { type, start_date, end_date, course_id } = req.query;

    let reportData: any = {};
    let dateFilter = '';
    let params: any[] = [];
    let paramIndex = 1;

    // Build date filter if provided
    if (start_date && end_date) {
      dateFilter = `AND DATE(created_at) BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      params.push(start_date, end_date);
    } else if (start_date) {
      dateFilter = `AND DATE(created_at) >= $${paramIndex++}`;
      params.push(start_date);
    } else if (end_date) {
      dateFilter = `AND DATE(created_at) <= $${paramIndex++}`;
      params.push(end_date);
    }

    switch (type) {
      case 'certificates':
        const certQuery = course_id
          ? `SELECT c.*, s.name as student_name, co.course_name 
             FROM certificates c 
             JOIN students s ON c.student_id = s.student_id 
             JOIN courses co ON c.course_id = co.course_id 
             WHERE co.course_id = $${paramIndex} ${dateFilter.replace('created_at', 'c.issued_at')} 
             ORDER BY c.issued_at DESC`
          : `SELECT c.*, s.name as student_name, co.course_name 
             FROM certificates c 
             JOIN students s ON c.student_id = s.student_id 
             JOIN courses co ON c.course_id = co.course_id 
             WHERE 1=1 ${dateFilter.replace('created_at', 'c.issued_at')} 
             ORDER BY c.issued_at DESC`;
        
        if (course_id) params.push(course_id);
        
        const certResult = await query(certQuery, params);
        reportData = {
          certificates: certResult.rows,
          summary: {
            total: certResult.rows.length,
            active: certResult.rows.filter((c: any) => c.status === 'active').length,
            revoked: certResult.rows.filter((c: any) => c.status === 'revoked').length
          }
        };
        break;

      case 'students':
        const studentResult = await query(
          `SELECT * FROM students WHERE 1=1 ${dateFilter} ORDER BY created_at DESC`,
          params
        );
        reportData = {
          students: studentResult.rows,
          summary: {
            total: studentResult.rows.length,
            active: studentResult.rows.filter((s: any) => s.is_active).length,
            inactive: studentResult.rows.filter((s: any) => !s.is_active).length
          }
        };
        break;

      case 'courses':
        const courseResult = await query(
          `SELECT c.*, COUNT(cert.certificate_id) as certificate_count 
           FROM courses c 
           LEFT JOIN certificates cert ON c.course_id = cert.course_id 
           WHERE 1=1 ${dateFilter.replace('created_at', 'c.created_at')} 
           GROUP BY c.course_id 
           ORDER BY c.created_at DESC`,
          params
        );
        reportData = {
          courses: courseResult.rows,
          summary: {
            total: courseResult.rows.length,
            active: courseResult.rows.filter((c: any) => c.is_active).length,
            inactive: courseResult.rows.filter((c: any) => !c.is_active).length
          }
        };
        break;

      case 'verifications':
        const verificationResult = await query(
          `SELECT * FROM verification_logs 
           WHERE 1=1 ${dateFilter.replace('created_at', 'verified_at')} 
           ORDER BY verified_at DESC`,
          params
        );
        reportData = {
          verifications: verificationResult.rows,
          summary: {
            total: verificationResult.rows.length,
            successful: verificationResult.rows.filter((v: any) => v.verification_result).length,
            failed: verificationResult.rows.filter((v: any) => !v.verification_result).length
          }
        };
        break;

      case 'audit':
        const auditResult = await query(
          `SELECT a.*, admin.name as admin_name 
           FROM audit_logs a 
           LEFT JOIN admins admin ON a.admin_id = admin.admin_id 
           WHERE 1=1 ${dateFilter.replace('created_at', 'a.created_at')} 
           ORDER BY a.created_at DESC`,
          params
        );
        reportData = {
          audit_logs: auditResult.rows,
          summary: {
            total: auditResult.rows.length,
            actions: auditResult.rows.reduce((acc: any, log: any) => {
              acc[log.action] = (acc[log.action] || 0) + 1;
              return acc;
            }, {})
          }
        };
        break;

      default:
        throw createError('Invalid report type', 400);
    }

    res.json({
      success: true,
      data: {
        type,
        filters: { start_date, end_date, course_id },
        generated_at: new Date().toISOString(),
        ...reportData
      }
    });
  })
);

export default router;
