import React, { useState, useEffect } from 'react';
import { XMarkIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

interface Course {
  id: number;
  code: string;
  title: string;
  description?: string;
  isActive: boolean;
}

interface Student {
  id: string;
  name: string;
  enrolledCourses: Course[];
}

interface CertificateGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onGenerate: (courseId: number) => Promise<void>;
  isGenerating: boolean;
}

const CertificateGenerationModal: React.FC<CertificateGenerationModalProps> = ({
  isOpen,
  onClose,
  student,
  onGenerate,
  isGenerating
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes or student changes
  useEffect(() => {
    if (isOpen && student) {
      if (student.enrolledCourses.length === 1) {
        setSelectedCourseId(student.enrolledCourses[0].id);
      } else {
        setSelectedCourseId('');
      }
      setError(null);
    }
  }, [isOpen, student]);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      setError('Please select a course');
      return;
    }

    try {
      await onGenerate(Number(selectedCourseId));
      onClose();
    } catch (err) {
      // Error handling is done in parent, but we can show a local error if needed
      // For now, we assume parent handles toasts
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-slate-900/75 bg-opacity-75 transition-opacity backdrop-blur-sm" 
          aria-hidden="true"
          onClick={!isGenerating ? onClose : undefined}
        ></div>

        {/* Modal panel */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full border border-slate-200 dark:border-slate-700">
          
          {/* Header */}
          <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-slate-100 dark:border-slate-700">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 sm:mx-0 sm:h-10 sm:w-10">
                <AcademicCapIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white" id="modal-title">
                  Generate Certificate
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Generate a completion certificate for <span className="font-semibold text-slate-900 dark:text-slate-200">{student.name}</span>.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="course" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Select Course
                  </label>
                  <select
                    id="course"
                    value={selectedCourseId}
                    onChange={(e) => {
                      setSelectedCourseId(Number(e.target.value));
                      setError(null);
                    }}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={isGenerating}
                  >
                    <option value="" disabled>Select a course...</option>
                    {student.enrolledCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title} ({course.code})
                      </option>
                    ))}
                  </select>
                  {error && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
                  )}
                  {student.enrolledCourses.length === 0 && (
                    <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                      This student is not enrolled in any courses.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-slate-100 dark:border-slate-700">
              <button
                type="submit"
                disabled={isGenerating || !selectedCourseId}
                className={`w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm transition-all
                  ${isGenerating || !selectedCourseId 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  'Generate Certificate'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isGenerating}
                className="mt-3 w-full inline-flex justify-center rounded-xl border border-slate-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-700 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CertificateGenerationModal;
