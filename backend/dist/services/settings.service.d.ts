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
export interface AdminPreferences extends NotificationPreferences, SystemPreferences {
}
export declare class SettingsService {
    /**
     * Get admin profile information
     */
    static getProfile(adminId: number): Promise<any>;
    /**
     * Update admin profile
     */
    static updateProfile(adminId: number, data: ProfileUpdateData): Promise<any>;
    /**
     * Change admin password
     */
    static changePassword(adminId: number, data: PasswordChangeData): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Get admin preferences (creates default if doesn't exist)
     */
    static getPreferences(adminId: number): Promise<AdminPreferences>;
    /**
     * Update admin preferences
     */
    static updatePreferences(adminId: number, preferences: Partial<AdminPreferences>): Promise<AdminPreferences>;
    /**
     * Get system configuration (admin only)
     */
    static getSystemConfig(): Promise<any[]>;
    /**
     * Update system configuration (admin only)
     */
    static updateSystemConfig(adminId: number, configKey: string, configValue: string): Promise<any>;
    /**
     * Map database row to camelCase preferences object
     */
    private static mapPreferences;
}
//# sourceMappingURL=settings.service.d.ts.map