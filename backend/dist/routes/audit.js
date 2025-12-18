"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const express_validator_1 = require("express-validator");
const connection_1 = require("../database/connection");
const router = (0, express_1.Router)();
// All audit routes require authentication
router.use(auth_1.authenticateToken);
/**
 * @swagger
 * /audit/logs:
 *   get:
 *     summary: Get audit logs with pagination and filters
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE]
 *       - in: query
 *         name: table_name
 *         schema:
 *           type: string
 *       - in: query
 *         name: admin_id
 *         schema:
 *           type: string
 *           format: uuid
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
 *     responses:
 *       200:
 *         description: List of audit logs
 */
router.get('/logs', (0, auth_1.authorizeRoles)('super_admin', 'admin'), [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('action').optional().isIn(['CREATE', 'UPDATE', 'DELETE']),
    (0, express_validator_1.query)('table_name').optional().isString().trim(),
    (0, express_validator_1.query)('admin_id').optional().isUUID(),
    (0, express_validator_1.query)('start_date').optional().isDate(),
    (0, express_validator_1.query)('end_date').optional().isDate()
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map((err) => ({
            field: err.param,
            message: err.msg
        })));
    }
    const page = parseInt(req.query['page'], 10) || 1;
    const limit = parseInt(req.query['limit'], 10) || 20;
    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;
    // Build WHERE conditions
    if (req.query['action']) {
        whereConditions.push(`a.action = $${paramIndex++}`);
        queryParams.push(req.query['action']);
    }
    if (req.query['table_name']) {
        whereConditions.push(`a.table_name = $${paramIndex++}`);
        queryParams.push(req.query['table_name']);
    }
    if (req.query['admin_id']) {
        whereConditions.push(`a.admin_id = $${paramIndex++}`);
        queryParams.push(req.query['admin_id']);
    }
    if (req.query['start_date']) {
        whereConditions.push(`DATE(a.created_at) >= $${paramIndex++}`);
        queryParams.push(req.query['start_date']);
    }
    if (req.query['end_date']) {
        whereConditions.push(`DATE(a.created_at) <= $${paramIndex++}`);
        queryParams.push(req.query['end_date']);
    }
    const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';
    // Get audit logs
    const logsQuery = `
      SELECT 
        a.*,
        admin.name as admin_name,
        admin.email as admin_email
      FROM audit_logs a
      LEFT JOIN admins admin ON a.admin_id = admin.admin_id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;
    queryParams.push(limit, offset);
    const logsResult = await (0, connection_1.query)(logsQuery, queryParams);
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs a
      ${whereClause}
    `;
    const countResult = await (0, connection_1.query)(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);
    res.json({
        success: true,
        data: {
            logs: logsResult.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    });
}));
/**
 * @swagger
 * /audit/stats:
 *   get:
 *     summary: Get audit statistics
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *     responses:
 *       200:
 *         description: Audit statistics
 */
router.get('/stats', (0, auth_1.authorizeRoles)('super_admin', 'admin'), [
    (0, express_validator_1.query)('days').optional().isInt({ min: 1, max: 365 }).toInt()
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map((err) => ({
            field: err.param,
            message: err.msg
        })));
    }
    const days = parseInt(req.query['days'], 10) || 30;
    // Get overall statistics
    const overallStatsResult = await (0, connection_1.query)(`
      SELECT 
        COUNT(*) as total_actions,
        COUNT(*) FILTER (WHERE action = 'CREATE') as create_actions,
        COUNT(*) FILTER (WHERE action = 'UPDATE') as update_actions,
        COUNT(*) FILTER (WHERE action = 'DELETE') as delete_actions,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '${days} days') as recent_actions,
        COUNT(DISTINCT admin_id) as active_admins
      FROM audit_logs
      WHERE created_at >= NOW() - INTERVAL '${days} days'
    `);
    // Get actions by table
    const tableStatsResult = await (0, connection_1.query)(`
      SELECT 
        table_name,
        COUNT(*) as action_count,
        COUNT(*) FILTER (WHERE action = 'CREATE') as creates,
        COUNT(*) FILTER (WHERE action = 'UPDATE') as updates,
        COUNT(*) FILTER (WHERE action = 'DELETE') as deletes
      FROM audit_logs
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY table_name
      ORDER BY action_count DESC
    `);
    // Get actions by admin
    const adminStatsResult = await (0, connection_1.query)(`
      SELECT 
        a.admin_id,
        admin.name as admin_name,
        admin.email as admin_email,
        COUNT(*) as action_count,
        MAX(a.created_at) as last_action
      FROM audit_logs a
      LEFT JOIN admins admin ON a.admin_id = admin.admin_id
      WHERE a.created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY a.admin_id, admin.name, admin.email
      ORDER BY action_count DESC
      LIMIT 10
    `);
    // Get daily activity (last 30 days)
    const dailyActivityResult = await (0, connection_1.query)(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_actions,
        COUNT(*) FILTER (WHERE action = 'CREATE') as creates,
        COUNT(*) FILTER (WHERE action = 'UPDATE') as updates,
        COUNT(*) FILTER (WHERE action = 'DELETE') as deletes
      FROM audit_logs
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    res.json({
        success: true,
        data: {
            period_days: days,
            overall: overallStatsResult.rows[0],
            by_table: tableStatsResult.rows,
            by_admin: adminStatsResult.rows,
            daily_activity: dailyActivityResult.rows
        }
    });
}));
/**
 * @swagger
 * /audit/export:
 *   get:
 *     summary: Export audit logs (CSV format)
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *     responses:
 *       200:
 *         description: Exported audit logs
 */
router.get('/export', (0, auth_1.authorizeRoles)('super_admin'), [
    (0, express_validator_1.query)('start_date').isDate().withMessage('Start date is required'),
    (0, express_validator_1.query)('end_date').isDate().withMessage('End date is required'),
    (0, express_validator_1.query)('format').optional().isIn(['json', 'csv']).withMessage('Format must be json or csv')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.createError)('Validation failed', 400, errors.array().map((err) => ({
            field: err.param,
            message: err.msg
        })));
    }
    const { start_date, end_date, format = 'json' } = req.query;
    const logsResult = await (0, connection_1.query)(`
      SELECT 
        a.log_id,
        a.admin_id,
        admin.name as admin_name,
        admin.email as admin_email,
        a.action,
        a.table_name,
        a.record_id,
        a.old_values,
        a.new_values,
        a.ip_address,
        a.user_agent,
        a.created_at
      FROM audit_logs a
      LEFT JOIN admins admin ON a.admin_id = admin.admin_id
      WHERE DATE(a.created_at) BETWEEN $1 AND $2
      ORDER BY a.created_at ASC
    `, [start_date, end_date]);
    if (format === 'csv') {
        // Convert to CSV format
        const headers = [
            'Log ID', 'Admin ID', 'Admin Name', 'Admin Email', 'Action',
            'Table', 'Record ID', 'IP Address', 'User Agent', 'Created At'
        ];
        let csvContent = headers.join(',') + '\n';
        logsResult.rows.forEach((row) => {
            const csvRow = [
                row.log_id,
                row.admin_id || '',
                `"${row.admin_name || ''}"`,
                row.admin_email || '',
                row.action,
                row.table_name,
                row.record_id || '',
                `"${row.ip_address || ''}"`,
                `"${(row.user_agent || '').replace(/"/g, '""')}"`,
                row.created_at
            ];
            csvContent += csvRow.join(',') + '\n';
        });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${start_date}-to-${end_date}.csv"`);
        res.send(csvContent);
    }
    else {
        res.json({
            success: true,
            data: {
                export_info: {
                    start_date,
                    end_date,
                    total_records: logsResult.rows.length,
                    exported_at: new Date().toISOString()
                },
                logs: logsResult.rows
            }
        });
    }
}));
exports.default = router;
