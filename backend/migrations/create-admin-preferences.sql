-- Create admin_preferences table for per-user settings
CREATE TABLE IF NOT EXISTS admin_preferences (
  admin_id INTEGER PRIMARY KEY REFERENCES admins(admin_id) ON DELETE CASCADE,
  
  -- Notification preferences
  email_notifications BOOLEAN DEFAULT TRUE,
  student_enrollment_notifications BOOLEAN DEFAULT TRUE,
  certificate_notifications BOOLEAN DEFAULT FALSE,
  system_notifications BOOLEAN DEFAULT TRUE,
  
  -- System preferences
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'en',
  date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
  items_per_page INTEGER DEFAULT 10,
  
  -- Timestamps
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_preferences_admin_id ON admin_preferences(admin_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_preferences_updated_at_trigger
BEFORE UPDATE ON admin_preferences
FOR EACH ROW
EXECUTE FUNCTION update_admin_preferences_updated_at();

-- Insert default preferences for existing admins
INSERT INTO admin_preferences (admin_id)
SELECT admin_id FROM admins
ON CONFLICT (admin_id) DO NOTHING;

-- Display results
SELECT 'admin_preferences table created successfully' AS status;
SELECT COUNT(*) AS total_preferences FROM admin_preferences;
