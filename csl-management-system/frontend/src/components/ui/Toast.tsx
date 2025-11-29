import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, type, title, message, duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);
    
    // Auto close
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      case 'info':
        return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-white dark:bg-slate-800 border-l-4 border-l-green-500 shadow-lg shadow-green-500/10';
      case 'error':
        return 'bg-white dark:bg-slate-800 border-l-4 border-l-red-500 shadow-lg shadow-red-500/10';
      case 'warning':
        return 'bg-white dark:bg-slate-800 border-l-4 border-l-yellow-500 shadow-lg shadow-yellow-500/10';
      case 'info':
        return 'bg-white dark:bg-slate-800 border-l-4 border-l-blue-500 shadow-lg shadow-blue-500/10';
    }
  };

  return (
    <div
      className={`
        ${getColorClasses()}
        rounded-lg p-4 mb-4 min-w-[320px] max-w-md
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${isLeaving ? 'scale-95' : 'scale-100'}
      `}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            {title}
          </div>
          {message && (
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {message}
            </div>
          )}
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
        >
          <XMarkIcon className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
