import React, { useState, useEffect } from 'react';
import { 
  UserIcon,
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/authStore';
import { settingsService, AdminProfile, AdminPreferences, SystemConfig } from '../../services/settingsService';
import toast from 'react-hot-toast';

interface SettingSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
}

const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeSection, setActiveSection] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: ''
  });

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Preferences state
  const [preferences, setPreferences] = useState<AdminPreferences | null>(null);
  
  // System config state
  const [systemConfig, setSystemConfig] = useState<SystemConfig[]>([]);

  // Load data on mount
  useEffect(() => {
    loadProfileData();
    loadPreferences();
    if (user?.role === 'admin') {
      loadSystemConfig();
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      const response = await settingsService.getProfile();
      const profileData = response.data;
      setProfile(profileData);
      setProfileForm({
        firstName: profileData.first_name || '',
        lastName: profileData.last_name || '',
        email: profileData.email || '',
        mobile: profileData.mobile || ''
      });
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile data');
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await settingsService.getPreferences();
      setPreferences(response.data);
    } catch (error: any) {
      console.error('Failed to load preferences:', error);
    }
  };

  const loadSystemConfig = async () => {
    try {
      const response = await settingsService.getSystemConfig();
      setSystemConfig(response.data);
    } catch (error: any) {
      console.error('Failed to load system config:', error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await settingsService.updateProfile(profileForm);
      toast.success('Profile updated successfully');
      await loadProfileData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await settingsService.changePassword(passwordForm);
      toast.success('Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceToggle = async (key: keyof AdminPreferences, value: boolean) => {
    try {
      const response = await settingsService.updatePreferences({ [key]: value });
      setPreferences(response.data);
      toast.success('Preferences updated');
    } catch (error: any) {
      toast.error('Failed to update preferences');
    }
  };

  const handlePreferenceChange = async (key: keyof AdminPreferences, value: string | number) => {
    try {
      const response = await settingsService.updatePreferences({ [key]: value });
      setPreferences(response.data);
      toast.success('Preferences saved');
    } catch (error: any) {
      toast.error('Failed to save preferences');
    }
  };

  const settingSections: SettingSection[] = [
    {
      id: 'profile',
      title: 'Profile Settings',
      icon: UserIcon,
      description: 'Manage your personal information and preferences'
    },
    {
      id: 'security',
      title: 'Security',
      icon: ShieldCheckIcon,
      description: 'Password and authentication settings'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: BellIcon,
      description: 'Configure email and system notifications'
    },
    {
      id: 'system',
      title: 'System Settings',
      icon: CogIcon,
      description: 'Application preferences and configurations'
    }
  ];

  const ProfileSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-slate-900 dark:text-white">Profile Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
            Full Name
          </label>
          <input
            type="text"
            defaultValue={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
            className="w-full px-3 py-2 bg-white dark:bg-white/10 border border-slate-300 dark:border-white/20 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors duration-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            defaultValue={user?.email || ''}
            className="w-full px-3 py-2 bg-white dark:bg-white/10 border border-slate-300 dark:border-white/20 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors duration-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            placeholder="+1 (555) 123-4567"
            className="w-full px-3 py-2 bg-white dark:bg-white/10 border border-slate-300 dark:border-white/20 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors duration-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
            Role
          </label>
          <input
            type="text"
            value={user?.role || 'User'}
            disabled
            className="w-full px-3 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-500 dark:text-gray-400 cursor-not-allowed"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
          Bio
        </label>
        <textarea
          rows={4}
          placeholder="Tell us about yourself..."
          className="w-full px-3 py-2 bg-white dark:bg-white/10 border border-slate-300 dark:border-white/20 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors duration-200 resize-none"
        />
      </div>

      <div className="flex justify-end">
        <button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-2 rounded-lg transition-all duration-200">
          Save Changes
        </button>
      </div>
    </div>
  );

  const SecuritySection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-slate-900 dark:text-white">Security Settings</h3>
      
      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <KeyIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400">Change Password</h4>
            <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
              Ensure your account is using a long, random password to stay secure.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              className="w-full px-3 py-2 bg-white dark:bg-white/10 border border-slate-300 dark:border-white/20 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors duration-200 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white"
            >
              {showCurrentPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
            New Password
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              className="w-full px-3 py-2 bg-white dark:bg-white/10 border border-slate-300 dark:border-white/20 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors duration-200 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white"
            >
              {showNewPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              className="w-full px-3 py-2 bg-white dark:bg-white/10 border border-slate-300 dark:border-white/20 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors duration-200 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white"
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-2 rounded-lg transition-all duration-200">
          Update Password
        </button>
      </div>
    </div>
  );

  const NotificationsSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-slate-900 dark:text-white">Notification Preferences</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-transparent">
          <div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-white">Email Notifications</h4>
            <p className="text-sm text-slate-600 dark:text-gray-400">Receive notifications via email</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-slate-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-transparent">
          <div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-white">Student Enrollment</h4>
            <p className="text-sm text-slate-600 dark:text-gray-400">Notify when new students enroll</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-slate-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-transparent">
          <div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-white">Certificate Requests</h4>
            <p className="text-sm text-slate-600 dark:text-gray-400">Notify for certificate verification requests</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-transparent">
          <div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-white">System Updates</h4>
            <p className="text-sm text-slate-600 dark:text-gray-400">Important system announcements</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-slate-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </div>
    </div>
  );

  const SystemSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-slate-900 dark:text-white">System Preferences</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
            Time Zone
          </label>
          <select className="w-full px-3 py-2 bg-white dark:bg-white/10 border border-slate-300 dark:border-white/20 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors duration-200 [&>option]:bg-white [&>option]:dark:bg-slate-800 [&>option]:text-slate-900 [&>option]:dark:text-white">
            <option value="UTC">UTC (GMT+0)</option>
            <option value="EST">Eastern Time (GMT-5)</option>
            <option value="PST">Pacific Time (GMT-8)</option>
            <option value="CST">Central Time (GMT-6)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
            Language
          </label>
          <select className="w-full px-3 py-2 bg-white dark:bg-white/10 border border-slate-300 dark:border-white/20 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors duration-200 [&>option]:bg-white [&>option]:dark:bg-slate-800 [&>option]:text-slate-900 [&>option]:dark:text-white">
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
            Date Format
          </label>
          <select className="w-full px-3 py-2 bg-white dark:bg-white/10 border border-slate-300 dark:border-white/20 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors duration-200 [&>option]:bg-white [&>option]:dark:bg-slate-800 [&>option]:text-slate-900 [&>option]:dark:text-white">
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
            Items per Page
          </label>
          <select className="w-full px-3 py-2 bg-white dark:bg-white/10 border border-slate-300 dark:border-white/20 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors duration-200 [&>option]:bg-white [&>option]:dark:bg-slate-800 [&>option]:text-slate-900 [&>option]:dark:text-white">
            <option value="10">10 items</option>
            <option value="25">25 items</option>
            <option value="50">50 items</option>
            <option value="100">100 items</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-2 rounded-lg transition-all duration-200">
          Save Preferences
        </button>
      </div>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection />;
      case 'security':
        return <SecuritySection />;
      case 'notifications':
        return <NotificationsSection />;
      case 'system':
        return <SystemSection />;
      default:
        return <ProfileSection />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-600 dark:text-gray-300 mt-1">Manage your account and application preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-white/10 backdrop-blur-md rounded-xl border border-slate-200 dark:border-white/20 p-4 shadow-sm">
            <nav className="space-y-2">
              {settingSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeSection === section.id
                      ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-700 dark:text-white border border-indigo-400/30'
                      : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
                >
                  <section.icon className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <div>{section.title}</div>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-white/10 backdrop-blur-md rounded-xl border border-slate-200 dark:border-white/20 p-6 shadow-sm">
            {renderActiveSection()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
