import React from 'react';
import { ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  type = 'danger',
  isLoading = false
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <TrashIcon className="h-6 w-6 text-red-500" />,
          iconBg: 'bg-red-100 dark:bg-red-900/30',
          confirmBtn: 'bg-red-500 hover:bg-red-600 focus:ring-red-500'
        };
      case 'warning':
        return {
          icon: <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />,
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
          confirmBtn: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500'
        };
      case 'info':
        return {
          icon: <ExclamationTriangleIcon className="h-6 w-6 text-blue-500" />,
          iconBg: 'bg-blue-100 dark:bg-blue-900/30',
          confirmBtn: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500'
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onCancel();
        }
      }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-200 animate-scaleIn">
        <div className="p-6">
          {/* Icon */}
          <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${typeStyles.iconBg} mb-4`}>
            {typeStyles.icon}
          </div>

          {/* Content */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${typeStyles.confirmBtn}`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Deleting...
                </>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
