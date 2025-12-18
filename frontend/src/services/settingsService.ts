import api from '../lib/api';

export interface AdminProfile {
  admin_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  mobile?: string;
  role: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
}

export interface ProfileUpdateData {
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AdminPreferences {
  emailNotifications: boolean;
  studentEnrollmentNotifications: boolean;
  certificateNotifications: boolean;
  systemNotifications: boolean;
  timezone: string;
  language: string;
  dateFormat: string;
  itemsPerPage: number;
}

export interface SystemConfig {
  config_key: string;
  config_value: string;
  description: string;
  updated_at: string;
}

class SettingsService {
  /**
   * Get current admin profile
   */
  async getProfile() {
    const response = await api.get('/settings/profile');
    return response.data;
  }

  /**
   * Update admin profile
   */
  async updateProfile(data: ProfileUpdateData) {
    const response = await api.put('/settings/profile', data);
    return response.data;
  }

  /**
   * Change password
   */
  async changePassword(data: PasswordChangeData) {
    const response = await api.put('/settings/password', data);
    return response.data;
  }

  /**
   * Get admin preferences
   */
  async getPreferences() {
    const response = await api.get('/settings/preferences');
    return response.data;
  }

  /**
   * Update admin preferences
   */
  async updatePreferences(preferences: Partial<AdminPreferences>) {
    const response = await api.put('/settings/preferences', preferences);
    return response.data;
  }

  /**
   * Get system configuration (admin only)
   */
  async getSystemConfig() {
    const response = await api.get('/settings/system');
    return response.data;
  }

  /**
   * Update system configuration (admin only)
   */
  async updateSystemConfig(configKey: string, configValue: string) {
    const response = await api.put(`/settings/system/${configKey}`, { configValue });
    return response.data;
  }
}

export const settingsService = new SettingsService();
