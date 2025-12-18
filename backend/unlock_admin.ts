
import { connectDatabase, closeDatabase, query } from './src/database/connection';
import { logger } from './src/utils/logger';

const unlockAdmin = async () => {
  try {
    await connectDatabase();
    
    const email = 'admin@csl.com'; // Default admin email
    
    logger.info(`Unlocking account for ${email}...`);
    
    const result = await query(`
      UPDATE admins 
      SET failed_login_attempts = 0, 
          account_locked_until = NULL 
      WHERE email = $1
      RETURNING admin_id, email
    `, [email]);
    
    if (result.rowCount > 0) {
      logger.info('Account unlocked successfully:', result.rows[0]);
    } else {
      logger.warn('No admin found with that email.');
    }
    
  } catch (error) {
    logger.error('Error unlocking account:', error);
  } finally {
    await closeDatabase();
  }
};

unlockAdmin();
