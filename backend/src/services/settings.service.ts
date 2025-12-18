import bcrypt from 'bcryptjs';
import { getPool } from '../database/connection';
import { logger } from '../utils/logger';

export interface ProfileUpdateData {
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  studentEnrollmentNotifications: boolean;
  certificateNotifications: boolean;
  systemNotifications: boolean;
}

export interface SystemPreferences {
  timezone: string;
  language: string;
  dateFormat: string;
  itemsPerPage: number;
}

export interface AdminPreferences extends NotificationPreferences, SystemPreferences {}

export class SettingsService {
  /**
   * Get admin profile information
   */
  static async getProfile(adminId: number) {
    const pool = getPool();
    
    const result = await pool.query(
      `SELECT 
        admin_id,
        username,
        email,
        first_name,
        last_name,
        mobile,
        role,
        is_active,
        last_login_at,
        created_at
      FROM admins 
      WHERE admin_id = $1`,
      [adminId]
    );

    if (result.rows.length === 0) {
      throw new Error('Admin not found');
    }

    return result.rows[0];
  }

  /**
   * Update admin profile
   */
  static async updateProfile(adminId: number, data: ProfileUpdateData) {
    const pool = getPool();
    
    // Check if email is already taken by another admin
    const emailCheck = await pool.query(
      'SELECT admin_id FROM admins WHERE email = $1 AND admin_id != $2',
      [data.email, adminId]
    );

    if (emailCheck.rows.length > 0) {
      throw new Error('Email address is already in use');
    }

    const result = await pool.query(
      `UPDATE admins 
       SET first_name = $1, 
           last_name = $2, 
           email = $3, 
           mobile = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE admin_id = $5
       RETURNING admin_id, username, email, first_name, last_name, mobile, role`,
      [data.firstName, data.lastName, data.email, data.mobile || null, adminId]
    );

    if (result.rows.length === 0) {
      throw new Error('Failed to update profile');
    }

    logger.info('Profile updated', { adminId, email: data.email });
    return result.rows[0];
  }

  /**
   * Change admin password
   */
  static async changePassword(adminId: number, data: PasswordChangeData) {
    const pool = getPool();
    
    // Get current password hash
    const adminResult = await pool.query(
      'SELECT password_hash FROM admins WHERE admin_id = $1',
      [adminId]
    );

    if (adminResult.rows.length === 0) {
      throw new Error('Admin not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      data.currentPassword,
      adminResult.rows[0].password_hash
    );

    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const newPasswordHash = await bcrypt.hash(data.newPassword, salt);

    // Update password
    await pool.query(
      `UPDATE admins 
       SET password_hash = $1, 
           updated_at = CURRENT_TIMESTAMP,
           failed_login_attempts = 0,
           account_locked_until = NULL
       WHERE admin_id = $2`,
      [newPasswordHash, adminId]
    );

    logger.info('Password changed', { adminId });
    return { success: true, message: 'Password updated successfully' };
  }

  /**
   * Get admin preferences (creates default if doesn't exist)
   */
  static async getPreferences(adminId: number): Promise<AdminPreferences> {
    const pool = getPool();
    
    const result = await pool.query(
      `SELECT 
        email_notifications,
        student_enrollment_notifications,
        certificate_notifications,
        system_notifications,
        timezone,
        language,
        date_format,
        items_per_page
      FROM admin_preferences 
      WHERE admin_id = $1`,
      [adminId]
    );

    if (result.rows.length === 0) {
      // Create default preferences
      const defaultPrefs = await pool.query(
        `INSERT INTO admin_preferences (
          admin_id,
          email_notifications,
          student_enrollment_notifications,
          certificate_notifications,
          system_notifications,
          timezone,
          language,
          date_format,
          items_per_page
        ) VALUES ($1, true, true, false, true, 'UTC', 'en', 'MM/DD/YYYY', 10)
        RETURNING 
          email_notifications,
          student_enrollment_notifications,
          certificate_notifications,
          system_notifications,
          timezone,
          language,
          date_format,
          items_per_page`,
        [adminId]
      );
      
      return this.mapPreferences(defaultPrefs.rows[0]);
    }

    return this.mapPreferences(result.rows[0]);
  }

  /**
   * Update admin preferences
   */
  static async updatePreferences(adminId: number, preferences: Partial<AdminPreferences>) {
    const pool = getPool();
    
    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (preferences.emailNotifications !== undefined) {
      updates.push(`email_notifications = $${paramIndex++}`);
      values.push(preferences.emailNotifications);
    }
    if (preferences.studentEnrollmentNotifications !== undefined) {
      updates.push(`student_enrollment_notifications = $${paramIndex++}`);
      values.push(preferences.studentEnrollmentNotifications);
    }
    if (preferences.certificateNotifications !== undefined) {
      updates.push(`certificate_notifications = $${paramIndex++}`);
      values.push(preferences.certificateNotifications);
    }
    if (preferences.systemNotifications !== undefined) {
      updates.push(`system_notifications = $${paramIndex++}`);
      values.push(preferences.systemNotifications);
    }
    if (preferences.timezone !== undefined) {
      updates.push(`timezone = $${paramIndex++}`);
      values.push(preferences.timezone);
    }
    if (preferences.language !== undefined) {
      updates.push(`language = $${paramIndex++}`);
      values.push(preferences.language);
    }
    if (preferences.dateFormat !== undefined) {
      updates.push(`date_format = $${paramIndex++}`);
      values.push(preferences.dateFormat);
    }
    if (preferences.itemsPerPage !== undefined) {
      updates.push(`items_per_page = $${paramIndex++}`);
      values.push(preferences.itemsPerPage);
    }

    if (updates.length === 0) {
      throw new Error('No preferences to update');
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(adminId);

    const query = `
      UPDATE admin_preferences 
      SET ${updates.join(', ')}
      WHERE admin_id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Failed to update preferences');
    }

    logger.info('Preferences updated', { adminId, preferences });
    return this.mapPreferences(result.rows[0]);
  }

  /**
   * Get system configuration (admin only)
   */
  static async getSystemConfig() {
    const pool = getPool();
    
    const result = await pool.query(
      `SELECT config_key, config_value, description, updated_at 
       FROM system_config 
       ORDER BY config_key`
    );

    return result.rows;
  }

  /**
   * Update system configuration (admin only)
   */
  static async updateSystemConfig(adminId: number, configKey: string, configValue: string) {
    const pool = getPool();
    
    const result = await pool.query(
      `UPDATE system_config 
       SET config_value = $1, 
           updated_at = CURRENT_TIMESTAMP,
           updated_by_admin_id = $2
       WHERE config_key = $3
       RETURNING *`,
      [configValue, adminId, configKey]
    );

    if (result.rows.length === 0) {
      throw new Error('Configuration key not found');
    }

    logger.info('System config updated', { adminId, configKey, configValue });
    return result.rows[0];
  }

  /**
   * Map database row to camelCase preferences object
   */
  private static mapPreferences(row: any): AdminPreferences {
    return {
      emailNotifications: row.email_notifications,
      studentEnrollmentNotifications: row.student_enrollment_notifications,
      certificateNotifications: row.certificate_notifications,
      systemNotifications: row.system_notifications,
      timezone: row.timezone,
      language: row.language,
      dateFormat: row.date_format,
      itemsPerPage: row.items_per_page
    };
  }
}
