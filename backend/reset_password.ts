
import { connectDatabase, closeDatabase, query } from './src/database/connection';
import bcrypt from 'bcryptjs';
import { logger } from './src/utils/logger';

const resetAdminPassword = async () => {
  try {
    await connectDatabase();
    
    const email = 'admin@csl.com';
    const newPassword = 'Admin@2025';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    logger.info(`Resetting password for ${email}...`);
    
    const result = await query(`
      UPDATE admins 
      SET password_hash = $1,
          failed_login_attempts = 0, 
          account_locked_until = NULL,
          is_active = true
      WHERE email = $2
      RETURNING admin_id, email
    `, [hashedPassword, email]);
    
    if (result.rowCount > 0) {
      logger.info('Password reset successfully for:', result.rows[0]);
    } else {
      logger.warn('No admin found with that email. Creating one...');
      // Create if not exists
      const createResult = await query(`
        INSERT INTO admins (username, email, password_hash, first_name, last_name, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING admin_id, email
      `, ['admin', email, hashedPassword, 'System', 'Admin', 'super_admin', true]);
      logger.info('Admin created successfully:', createResult.rows[0]);
    }
    
  } catch (error) {
    logger.error('Error resetting password:', error);
  } finally {
    await closeDatabase();
  }
};

resetAdminPassword();
