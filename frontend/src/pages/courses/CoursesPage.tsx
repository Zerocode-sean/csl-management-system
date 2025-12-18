import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { coursesService, Course } from '../../services/coursesService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorBanner from '../../components/ui/ErrorBanner';
import ToastContainer from '../../components/ui/ToastContainer';
import { ToastProps } from '../../components/ui/Toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const CoursesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data states
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCourse, setNewCourse] = useState({
    code: '',
    title: '',
    description: '',
    duration_months: 12,
    category: 'Programming', // Default
    level: 'Beginner' // Default
  });
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  
  // Delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const addToast = (type: ToastProps['type'], title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, message, onClose: (id) => setToasts(p => p.filter(t => t.id !== id)) }]);
  };

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const response = await coursesService.getAllCourses();
      if (response.success) {
        // Handle both array (legacy/simple) and paginated object response formats
        if (Array.isArray(response.data)) {
          setCourses(response.data);
        } else if (response.data && Array.isArray((response.data as any).courses)) {
          setCourses((response.data as any).courses);
        } else {
          setCourses([]);
        }
      } else {
        setCourses([]);
      }
    } catch (err) {
      setError('Failed to load courses');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await coursesService.createCourse({
        code: newCourse.code,
        title: newCourse.title,
        description: newCourse.description,
        duration_months: newCourse.duration_months,
        is_active: true
      });
      addToast('success', 'Course Created', `${newCourse.title} has been created.`);
      setShowAddModal(false);
      setNewCourse({ code: '', title: '', description: '', duration_months: 12, category: 'Programming', level: 'Beginner' });
      fetchCourses(); // Refresh list
    } catch (err: any) {
      addToast('error', 'Failed to create course', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCourse) return;
    setIsSubmitting(true);
    try {
      await coursesService.updateCourse(editCourse.course_id, {
        code: editCourse.code,
        title: editCourse.title,
        description: editCourse.description,
        duration_months: editCourse.duration_months,
        is_active: editCourse.is_active
      });
      addToast('success', 'Course Updated', `${editCourse.title} has been updated.`);
      setShowEditModal(false);
      setEditCourse(null);
      fetchCourses(); // Refresh list
    } catch (err: any) {
      addToast('error', 'Failed to update course', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async (course: Course) => {
    setCourseToDelete(course);
    setShowDeleteDialog(true);
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;
    setIsDeleting(true);
    try {
      await coursesService.deleteCourse(courseToDelete.course_id);
      addToast('success', 'Course Deleted', `${courseToDelete.title} has been deleted.`);
      setShowDeleteDialog(false);
      setCourseToDelete(null);
      fetchCourses(); // Refresh list
    } catch (err: any) {
      addToast('error', 'Failed to delete course', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (course: Course) => {
    setEditCourse({ ...course });
    setShowEditModal(true);
  };

  const filteredCourses = Array.isArray(courses) ? courses.filter(course => {
    if (!course) return false;
    const matchesSearch = (course.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (course.code?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    // Note: Backend doesn't support category/level yet, so these filters are client-side only if we add those fields later
    // For now, we just return true for category/level if they are 'all'
    return matchesSearch;
  }) : [];

  const getStatusBadge = (isActive: boolean) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    return isActive 
      ? `${baseClasses} bg-green-500/20 text-green-400 border border-green-500/30`
      : `${baseClasses} bg-gray-500/20 text-gray-400 border border-gray-500/30`;
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Course"
        message={`Are you sure you want to delete "${courseToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        type="danger"
        isLoading={isDeleting}
        onConfirm={confirmDeleteCourse}
        onCancel={() => {
          setShowDeleteDialog(false);
          setCourseToDelete(null);
        }}
      />
      <ToastContainer toasts={toasts} onRemoveToast={(id) => setToasts(p => p.filter(t => t.id !== id))} />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Courses</h1>
          <p className="text-slate-600 dark:text-gray-300 mt-1">Manage course offerings and curriculum</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Course</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-white/10 backdrop-blur-md rounded-xl border border-slate-200 dark:border-white/20 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search courses by code or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-white/10 border border-slate-300 dark:border-white/20 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors duration-200"
            />
          </div>
        </div>
      </div>

      {/* Loading/Error States */}
      {isLoading && <LoadingSpinner />}
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {/* Courses Grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.course_id} className="bg-white dark:bg-white/10 backdrop-blur-md rounded-xl border border-slate-200 dark:border-white/20 p-6 hover:bg-slate-50 dark:hover:bg-white/15 transition-all duration-300 group shadow-sm">
              {/* Course Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={getStatusBadge(course.is_active)}>
                      {course.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30">
                      {course.code}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors duration-200">
                    {course.title}
                  </h3>
                </div>
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button 
                    onClick={() => openEditModal(course)}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors duration-200 p-1"
                    title="Edit course"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteCourse(course)}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-200 p-1"
                    title="Delete course"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Course Description */}
              <p className="text-slate-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                {course.description || 'No description provided.'}
              </p>

              {/* Course Info */}
              <div className="space-y-3">
                <div className="flex items-center text-sm text-slate-600 dark:text-gray-300">
                  <ClockIcon className="h-4 w-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                  <span>Duration: {course.duration_months} months</span>
                </div>
                {(course.certificate_count !== undefined && course.certificate_count > 0) && (
                  <div className="flex items-center text-sm text-slate-600 dark:text-gray-300">
                    <UserGroupIcon className="h-4 w-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                    <span>Certified Students: {course.certificate_count || 0}</span>
                    {course.active_certificates !== undefined && (
                      <span className="ml-1 text-xs text-slate-500 dark:text-gray-400">({course.active_certificates} active)</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && filteredCourses.length === 0 && (
        <div className="bg-white dark:bg-white/10 backdrop-blur-md rounded-xl border border-slate-200 dark:border-white/20 p-12 text-center shadow-sm">
          <AcademicCapIcon className="mx-auto h-12 w-12 text-slate-400 dark:text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">No courses found</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-gray-400">
            {searchTerm ? 'Try adjusting your search criteria' : 'Get started by creating a new course'}
          </p>
        </div>
      )}

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreateCourse}>
                <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white" id="modal-title">
                        Add New Course
                      </h3>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Course Code</label>
                          <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white sm:text-sm px-3 py-2"
                            placeholder="e.g. CS101"
                            value={newCourse.code}
                            onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
                          <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white sm:text-sm px-3 py-2"
                            placeholder="Course Title"
                            value={newCourse.title}
                            onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                          <textarea
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white sm:text-sm px-3 py-2"
                            rows={3}
                            value={newCourse.description}
                            onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Duration (Months)</label>
                          <input
                            type="number"
                            min="1"
                            max="60"
                            required
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white sm:text-sm px-3 py-2"
                            value={newCourse.duration_months}
                            onChange={(e) => setNewCourse({ ...newCourse, duration_months: parseInt(e.target.value) })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Course'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-slate-600 dark:text-white dark:border-slate-500 dark:hover:bg-slate-500"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && editCourse && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleEditCourse}>
                <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white" id="modal-title">
                        Edit Course
                      </h3>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Course Code</label>
                          <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white sm:text-sm px-3 py-2"
                            placeholder="e.g. CS101"
                            value={editCourse.code}
                            onChange={(e) => setEditCourse({ ...editCourse, code: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
                          <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white sm:text-sm px-3 py-2"
                            placeholder="Course Title"
                            value={editCourse.title}
                            onChange={(e) => setEditCourse({ ...editCourse, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                          <textarea
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white sm:text-sm px-3 py-2"
                            rows={3}
                            value={editCourse.description || ''}
                            onChange={(e) => setEditCourse({ ...editCourse, description: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Duration (Months)</label>
                          <input
                            type="number"
                            min="1"
                            max="60"
                            required
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white sm:text-sm px-3 py-2"
                            value={editCourse.duration_months || 12}
                            onChange={(e) => setEditCourse({ ...editCourse, duration_months: parseInt(e.target.value) })}
                          />
                        </div>
                        <div>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                              checked={editCourse.is_active}
                              onChange={(e) => setEditCourse({ ...editCourse, is_active: e.target.checked })}
                            />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-slate-600 dark:text-white dark:border-slate-500 dark:hover:bg-slate-500"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditCourse(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
