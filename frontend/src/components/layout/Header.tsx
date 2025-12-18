import React from 'react';
import { BellIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../stores/authStore';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { resolvedTheme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };
  const { user } = useAuthStore();

  return (
    <header className="bg-white/10 backdrop-blur-md border-b border-white/20 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Title Section */}
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-300 mt-1">{subtitle}</p>
          )}
        </div>

        {/* Actions Section */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-300 hover:text-white transition-colors duration-200">
            <BellIcon className="h-6 w-6" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-300 hover:text-white transition-colors duration-200"
          >
            {resolvedTheme === 'dark' ? (
              <SunIcon className="h-6 w-6" />
            ) : (
              <MoonIcon className="h-6 w-6" />
            )}
          </button>

          {/* User Avatar */}
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
