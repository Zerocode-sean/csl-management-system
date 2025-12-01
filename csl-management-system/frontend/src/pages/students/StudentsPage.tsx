
// Force refresh
import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  UserCircleIcon,
  AcademicCapIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import ToastContainer from '../../components/ui/ToastContainer';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { ToastProps } from '../../components/ui/Toast';
import { studentsService } from '../../services/studentsService';
import { coursesService } from '../../services/coursesService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorBanner from '../../components/ui/ErrorBanner';

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
  email: string;
  phone: string;
  studentId: string;
  address: string;
  dateOfBirth?: string;
  profilePicture?: string; // URL or base64 image
  institution?: string; // Institution student is from
  grade?: string; // Student's grade/rating
  enrolledCourses: Course[];
  certificates: number;
  status: 'active' | 'inactive' | 'suspended';
  registrationDate: string;
  lastActive: string;
}

const StudentsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    phone: '',
    studentId: '',
    address: '',
    dateOfBirth: '',
    institution: '',
    grade: '',
    profilePicture: '',
    courseId: '',
    status: 'active' as 'active' | 'inactive' | 'suspended'
  });
  const [editStudent, setEditStudent] = useState({
    name: '',
    email: '',
    phone: '',
    studentId: '',
    address: '',
    dateOfBirth: '',
    institution: '',
    grade: '',
    profilePicture: '',
    courseId: '',
    enrolledCourses: [] as Course[],
    status: 'active' as 'active' | 'inactive' | 'suspended'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Loading and error states for UI feedback
  const [uiLoading, setUiLoading] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  
  // Toast and confirmation states
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast management functions
  const addToast = (type: ToastProps['type'], title: string, message?: string) => {
    const id = Date.now().toString();
    const newToast: ToastProps = {
      id,
      type,
      title,
      message,
      onClose: removeToast
    };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Mock courses data
  // State for courses list - loaded from API
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  // Load courses from backend
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoadingCourses(true);
      try {
        const response = await coursesService.getActiveCoursesForDropdown();
        console.log('DEBUG: Courses response:', response);
        if (response.success) {
          // Handle both array directly or nested in data object
          const coursesData = Array.isArray(response.data) ? response.data : (response.data as any).courses || [];
          console.log('DEBUG: Parsed courses data:', coursesData);
          
          // Map backend course data to frontend interface if needed, or use directly
          const mappedCourses = coursesData.map((c: any) => ({
            id: c.course_id, // Map Integer ID
            code: c.code,
            title: c.title,
            description: c.description,
            isActive: c.is_active,
            // Keep original fields too
            course_id: c.course_id,
          }));
          setCourses(mappedCourses as any); // Type assertion to match local Course interface
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        addToast('error', 'Failed to Load Courses', 'Could not load courses list. Please refresh the page.');
      } finally {
        setIsLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  // State for students list - loaded from API
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);

  // Load students from backend on component mount
  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoadingStudents(true);
      setUiLoading(true);
      setUiError(null);

      try {
        const response = await studentsService.getAllStudents() as {
          success: boolean;
          data: any[] | { students: any[] } | null;
        };
        // Defensive normalization: handle nested, array, or missing data
        let studentsRaw: any[] = [];
        if (response && response.success) {
          if (Array.isArray(response.data)) {
            studentsRaw = response.data;
          } else if (response.data && typeof response.data === 'object' && Array.isArray((response.data as any).students)) {
            studentsRaw = (response.data as any).students;
          } else {
            studentsRaw = [];
          }
        }

        // Defensive mapping: handle missing fields, fallback to empty string/array
        const mappedStudents = studentsRaw.map((student: any) => ({
          id: (student.student_id ?? student.id ?? '').toString(),
          name: student.name ?? student.full_name ?? '',
          email: student.email ?? '',
          phone: student.mobile ?? student.phone ?? student.phone_number ?? '',
          studentId: student.student_custom_id ?? student.studentId ?? '',
          address: student.address ?? '',
          dateOfBirth: student.date_of_birth ?? student.dateOfBirth ?? '',
          enrolledCourses: Array.isArray(student.courses) ? student.courses : (student.enrolledCourses ?? []),
          certificates: Number(student.certificate_count ?? student.certificates ?? 0),
          status: student.status ?? 'active',
          registrationDate: student.created_at ?? student.registration_date ?? student.registrationDate ?? new Date().toISOString().split('T')[0],
          lastActive: student.last_active ?? student.lastActive ?? '',
          profilePicture: student.profile_picture ?? student.profilePicture ?? '',
          institution: student.institution ?? student.home_institution ?? '',
          grade: student.grade ?? student.current_grade ?? '',
        }));

        setStudents(mappedStudents);
        console.log('Students loaded from API:', mappedStudents.length, mappedStudents);
      } catch (error) {
        console.error('Error fetching students:', error);
        setUiError(error instanceof Error ? error.message : 'Failed to load students');
        // Optionally load some demo data as fallback
        addToast('warning', 'Using Demo Data', 'Could not connect to backend. Showing sample data.');
        setStudents([
          {
            id: '1',
            name: 'John Doe',
            email: 'john.doe@email.com',
            phone: '+1-555-0101',
            studentId: 'CSL-2024-001',
            address: '123 Main St, New York, NY 10001',
            dateOfBirth: '1995-05-15',
            enrolledCourses: [
              { id: 1, code: 'WD', title: 'Web Development', isActive: true },
              { id: 2, code: 'DS', title: 'Data Science', isActive: true }
            ],
            certificates: 2,
            status: 'active',
            registrationDate: '2024-01-15',
            lastActive: '2 hours ago',
            profilePicture: '',
            institution: '',
            grade: '',
          }
        ]);
      } finally {
        setIsLoadingStudents(false);
        setUiLoading(false);
      }
    };
    fetchStudents();
  }, []); // Empty dependency array - load once on mount

  // Enhanced search and filter functionality
  const filteredStudents = students.filter(student => {
    // Improved search - more flexible and handles edge cases
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch = searchLower === '' || 
      student.name.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower) ||
      student.studentId.toLowerCase().includes(searchLower);
    
    const matchesStatus = selectedStatus === 'all' || student.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Add stats for better user feedback
  const totalStudents = students.length;
  // Uncomment these when we add dashboard stats display
  // const activeStudents = students.filter(s => s.status === 'active').length;
  // const inactiveStudents = students.filter(s => s.status === 'inactive').length;

  // Generate suggested student ID
  const generateSuggestedStudentId = () => {
    const year = new Date().getFullYear();
    const existingIds = students.map(s => s.studentId);
    let counter = 1;
    let suggestedId = `CSL-${year}-${String(counter).padStart(3, '0')}`;
    
    while (existingIds.includes(suggestedId)) {
      counter++;
      suggestedId = `CSL-${year}-${String(counter).padStart(3, '0')}`;
    }
    
    return suggestedId;
  };

  // Handle add student functionality
  const handleAddStudent = () => {
    const suggestedId = generateSuggestedStudentId();
    setNewStudent(prev => ({ ...prev, studentId: suggestedId }));
    setShowAddModal(true);
  };

  const handleSaveStudent = async () => {
    setIsSubmitting(true);
    setFormErrors({});

    // Enhanced validation
    const errors: {[key: string]: string} = {};

    // Name validation
    if (!newStudent.name.trim()) {
      errors.name = 'Full name is required';
    }

    // Email validation
    if (!newStudent.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStudent.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (!newStudent.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(newStudent.phone.replace(/[\s\-\(\)]/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }

    // Student ID validation (required and format)
    let studentId = newStudent.studentId.trim();
    if (!studentId) {
      errors.studentId = 'Student ID is required';
    } else if (!/^CSL-\d{4}-\d{3}$/.test(studentId)) {
      errors.studentId = 'Student ID must be in format CSL-YYYY-NNN';
    } else if (students.some(s => s.studentId === studentId)) {
      // Auto-generate a unique Student ID if duplicate found
      const year = new Date().getFullYear();
      let counter = 1;
      let suggestedId = `CSL-${year}-${String(counter).padStart(3, '0')}`;
      const existingIds = students.map(s => s.studentId);
      while (existingIds.includes(suggestedId)) {
        counter++;
        suggestedId = `CSL-${year}-${String(counter).padStart(3, '0')}`;
      }
      studentId = suggestedId;
      errors.studentId = `Student ID already exists. Suggested: ${studentId}`;
    }

    // Address validation
    if (!newStudent.address.trim()) {
      errors.address = 'Address is required';
    }


    // Email uniqueness check
    if (newStudent.email.trim() && students.some(s => s.email.toLowerCase() === newStudent.email.toLowerCase().trim())) {
      errors.email = 'Email address already exists';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Send correct field names to backend API
      const result = await studentsService.createStudent({
        student_custom_id: studentId, // Fixed: was student_id
        name: newStudent.name.trim(),
        email: newStudent.email.toLowerCase().trim(),
        phone: newStudent.phone.trim(), // Fixed: was mobile
        address: newStudent.address.trim(),
        date_of_birth: newStudent.dateOfBirth || undefined,
        home_institution: newStudent.institution.trim() || undefined,
        profile_picture: newStudent.profilePicture || undefined,
        current_grade: newStudent.grade || undefined,
        course_id: newStudent.courseId ? parseInt(newStudent.courseId) : undefined, // Send Integer ID
        status: newStudent.status
      });

      console.log('Student created on backend:', result);
      addToast('success', 'Student Added Successfully', `${newStudent.name} has been added and saved to the database.`);

      // Refresh students list from backend
      const refreshed = await studentsService.getAllStudents();
      if (refreshed.success && Array.isArray(refreshed.data)) {
        const mappedStudents = refreshed.data.map((student: any) => ({
          id: student.student_id?.toString() || student.id?.toString() || '',
          name: student.name || student.full_name || '',
          email: student.email || '',
          phone: student.phone || student.phone_number || '',
          studentId: student.student_custom_id || student.studentId || '',
          address: student.address || '',
          dateOfBirth: student.date_of_birth || student.dateOfBirth || '',
          profilePicture: student.profile_picture || student.profilePicture || '',
          institution: student.institution || student.home_institution || '',
          grade: student.grade || student.current_grade || '',
          enrolledCourses: student.courses || student.enrolledCourses || [],
          certificates: student.certificates_count || student.certificates || 0,
          status: student.status || 'active',
          registrationDate: student.registration_date || student.registrationDate || new Date().toISOString().split('T')[0],
          lastActive: student.last_active || student.lastActive || 'Recently'
        }));
        setStudents(mappedStudents);
      }

      // Reset form and close modal
      setNewStudent({
        name: '',
        email: '',
        phone: '',
        studentId: '',
        address: '',
        dateOfBirth: '',
        institution: '',
        grade: '',
        profilePicture: '',
        courseId: '',
        status: 'active'
      });
      setFormErrors({});
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding student:', error);
      setUiError(
        error instanceof Error ? error.message : 'Failed to add student.'
      );
      addToast('error', 'Failed to Add Student', 'An error occurred while adding the student. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (isSubmitting) return; // Prevent closing while submitting
    
    setShowAddModal(false);
    setNewStudent({ 
      name: '', 
      email: '', 
      phone: '', 
      studentId: '', 
      address: '', 
      dateOfBirth: '', 
      institution: '',
      grade: '',
      profilePicture: '',
      courseId: '', 
      status: 'active' 
    });
    setFormErrors({});
    setIsSubmitting(false);
  };

  // Action handlers
  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setEditStudent({
      name: student.name,
      email: student.email,
      phone: student.phone,
      studentId: student.studentId,
      address: student.address,
      dateOfBirth: student.dateOfBirth || '',
      institution: student.institution || '',
      grade: student.grade || '',
      profilePicture: student.profilePicture || '',
      courseId: '',
      enrolledCourses: [...student.enrolledCourses],
      status: student.status
    });
    setShowEditModal(true);
  };

  const handleDeleteStudent = (student: Student) => {
    setStudentToDelete(student);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;

    setIsDeleting(true);
    
    try {
      // Call API to delete student
      await studentsService.deleteStudent(parseInt(studentToDelete.id) || 0);
      
      setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
      addToast('success', 'Student Deleted', `${studentToDelete.name} has been removed from the system.`);
      
      setShowDeleteConfirm(false);
      setStudentToDelete(null);
    } catch (error) {
      addToast('error', 'Delete Failed', 'Failed to delete student. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteStudent = () => {
    if (isDeleting) return;
    setShowDeleteConfirm(false);
    setStudentToDelete(null);
  };

  const handleSaveEditStudent = async () => {
    if (!selectedStudent) return;

    setIsSubmitting(true);
    setFormErrors({});

    setIsSubmitting(true);
    setFormErrors({});

    // Enhanced validation
    const errors: {[key: string]: string} = {};

    // Name validation
    if (!editStudent.name.trim()) {
      errors.name = 'Full name is required';
    }

    // Email validation
    if (!editStudent.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editStudent.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (!editStudent.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(editStudent.phone.replace(/[\s\-\(\)]/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }

    // Student ID validation (required and format)
    if (!editStudent.studentId.trim()) {
      errors.studentId = 'Student ID is required';
    } else if (!/^CSL-\d{4}-\d{3}$/.test(editStudent.studentId.trim())) {
      errors.studentId = 'Student ID must be in format CSL-YYYY-NNN';
    }

    // Address validation
    if (!editStudent.address.trim()) {
      errors.address = 'Address is required';
    }

    // Email uniqueness check (exclude current student)
    if (
      editStudent.email.trim() &&
      students.some(s => s.email.toLowerCase() === editStudent.email.toLowerCase().trim() && s.id !== selectedStudent.id)
    ) {
      errors.email = 'Email address already exists';
    }

    // Student ID uniqueness check (exclude current student)
    if (
      editStudent.studentId.trim() &&
      students.some(s => s.studentId === editStudent.studentId.trim() && s.id !== selectedStudent.id)
    ) {
      errors.studentId = 'Student ID already exists';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await studentsService.updateStudent(parseInt(selectedStudent.id) || 0, {
        name: editStudent.name.trim(),
        email: editStudent.email.toLowerCase().trim(),
        phone: editStudent.phone.trim(),
        student_custom_id: editStudent.studentId.trim(),
        address: editStudent.address.trim(),
        date_of_birth: editStudent.dateOfBirth,
        profilePicture: editStudent.profilePicture.trim(),
        institution: editStudent.institution.trim(),
        grade: editStudent.grade,
        status: editStudent.status
      } as any);

      console.log('Student updated on backend:', result);
      addToast('success', 'Student Updated Successfully', `${editStudent.name} has been updated and saved to the database.`);

      // Update student in the list (optimistic update)
      setStudents(prev => prev.map(student => 
        student.id === selectedStudent.id 
          ? { 
              ...student, 
              name: editStudent.name.trim(),
              email: editStudent.email.toLowerCase().trim(),
              phone: editStudent.phone.trim(),
              studentId: editStudent.studentId.trim(),
              address: editStudent.address.trim(),
              dateOfBirth: editStudent.dateOfBirth,
              institution: editStudent.institution.trim(),
              grade: editStudent.grade,
              profilePicture: editStudent.profilePicture.trim(),
              enrolledCourses: [...editStudent.enrolledCourses],
              certificates: editStudent.enrolledCourses.length,
              status: editStudent.status
            }
          : student
      ));

      console.log(`✅ Student ${editStudent.name} has been updated successfully!`);
      
      // Reset and close modal
      setEditStudent({ 
        name: '', 
        email: '', 
        phone: '', 
        studentId: '', 
        address: '', 
        dateOfBirth: '', 
        institution: '',
        grade: '',
        profilePicture: '',
        courseId: '',
        enrolledCourses: [],
        status: 'active' 
      });
      setFormErrors({});
      setShowEditModal(false);
      setSelectedStudent(null);
    } catch (error) {
      console.error('Error updating student:', error);
      setUiError(
        error instanceof Error ? error.message : 'Failed to update student.'
      );
      addToast('error', 'Failed to Update Student', 'An error occurred while updating the student. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseEditModal = () => {
    if (isSubmitting) return;
    
    setShowEditModal(false);
    setEditStudent({ 
      name: '', 
      email: '', 
      phone: '', 
      studentId: '', 
      address: '', 
      dateOfBirth: '', 
      institution: '',
      grade: '',
      profilePicture: '',
      courseId: '',
      enrolledCourses: [],
      status: 'active' 
    });
    setFormErrors({});
    setSelectedStudent(null);
    setIsSubmitting(false);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedStudent(null);
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full";
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800`;
      case 'inactive':
        return `${baseClasses} bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-600`;
      case 'suspended':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800`;
      default:
        return baseClasses;
    }
  };

  // Certificate generation handler
  const handleGenerateCertificate = async (student: Student) => {
    console.log('Generating certificate for student:', student.name);
    console.log('Student ID:', student.id);
    console.log('Enrolled courses:', student.enrolledCourses);
    
    if (student.enrolledCourses.length === 0) {
      addToast('error', 'No Courses Enrolled', 'Student has no enrolled courses to generate certificate for');
      return;
    }

    // If student has multiple courses, show a selection modal (simplified for now, use first course)
    const course = student.enrolledCourses[0];
    console.log('Selected course:', course);
    
    try {
      console.log('Starting certificate generation...');
      
      const requestBody = {
        student_id: parseInt(student.id),
        course_id: course.id,
      };
      console.log('Request body:', requestBody);
      
      const response = await fetch('/api/v1/certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        // Handle PDF download
        const blob = await response.blob();
        console.log('PDF blob size:', blob.size);
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `certificate_${student.name.replace(/\s+/g, '_')}_${course.code}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        addToast('success', 'Certificate Generated', 'Certificate generated and downloaded successfully!');
      } else {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        
        let errorMessage = 'Failed to generate certificate';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Certificate generation error:', error);
      addToast('error', 'Certificate Generation Failed', error instanceof Error ? error.message : 'Failed to generate certificate');
    }
  };

  return (
    <>
      {/* UI Feedback */}
      {uiLoading && <LoadingSpinner />}
      {uiError && <ErrorBanner message={uiError ?? ''} onClose={() => setUiError(null)} />}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Students</h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-slate-600 dark:text-slate-400">Manage student accounts and enrollments</p>
            {(searchTerm || selectedStatus !== 'all') && (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Showing {filteredStudents.length} of {totalStudents} students
              </span>
            )}
          </div>
        </div>
        <button 
          onClick={handleAddStudent}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Student</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 hidden sm:block">
            Filter:
          </div>
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500 dark:text-slate-400" />
            <input
              type="text"
              placeholder="Search students by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm min-w-[140px]"
          >
            <option value="all" className="bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">All Status</option>
            <option value="active" className="bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">Active</option>
            <option value="inactive" className="bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">Inactive</option>
            <option value="suspended" className="bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">Suspended</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Student ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Courses
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Certificates
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
              {isLoadingStudents ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                      <p className="text-slate-600 dark:text-slate-400 font-medium">Loading students...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <UserCircleIcon className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
                      <p className="text-slate-600 dark:text-slate-400 font-medium mb-2">
                        {students.length === 0 ? 'No students yet' : 'No students found'}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-500">
                        {students.length === 0 
                          ? 'Click "Add New Student" to create your first student record'
                          : 'Try adjusting your search or filter criteria'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/70 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-11 w-11 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg overflow-hidden">
                        {student.profilePicture ? (
                          <img 
                            src={student.profilePicture} 
                            alt={student.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserCircleIcon className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{student.name}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-300">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{student.studentId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm font-medium text-slate-800 dark:text-slate-200">
                      <AcademicCapIcon className="h-4 w-4 mr-2 text-blue-500" />
                      <div className="flex flex-wrap gap-1">
                        {student.enrolledCourses.slice(0, 2).map((course) => (
                          <span key={course.id} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                            {course.code}
                          </span>
                        ))}
                        {student.enrolledCourses.length > 2 && (
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded-full">
                            +{student.enrolledCourses.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{student.certificates}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(student.status)}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                    {student.lastActive}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => handleViewStudent(student)}
                        className="group p-2.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20" 
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      </button>
                      <button 
                        onClick={() => handleGenerateCertificate(student)}
                        className="group p-2.5 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20" 
                        title="Generate Certificate"
                      >
                        <DocumentTextIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      </button>
                      <button 
                        onClick={() => handleEditStudent(student)}
                        className="group p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-slate-500/20" 
                        title="Edit Student"
                      >
                        <PencilIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      </button>
                      <button 
                        onClick={() => handleDeleteStudent(student)}
                        className="group p-2.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20" 
                        title="Delete Student"
                      >
                        <TrashIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
              <UserCircleIcon className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No students found</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {searchTerm || selectedStatus !== 'all' 
                ? 'Try adjusting your search criteria or filters to find students.' 
                : 'Get started by adding your first student to the system.'}
            </p>
            {(searchTerm || selectedStatus !== 'all') && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatus('all');
                }}
                className="mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              handleCloseModal();
            }
          }}
        >
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 max-w-md w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Student</h2>
                <button 
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Error Banner for backend errors */}
              {uiError && (
                <div className="mb-4">
                  <ErrorBanner message={uiError} onClose={() => setUiError(null)} />
                </div>
              )}

              {/* Form */}
              <div className="space-y-4">
                {/* Student Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newStudent.name}
                    onChange={(e) => {
                      setNewStudent({ ...newStudent, name: e.target.value });
                      if (formErrors.name) {
                        setFormErrors(prev => ({ ...prev, name: '' }));
                      }
                    }}
                    placeholder="Enter student's full name"
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      formErrors.name 
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                        : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'
                    }`}
                    disabled={isSubmitting}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => {
                      setNewStudent({ ...newStudent, email: e.target.value });
                      if (formErrors.email) {
                        setFormErrors(prev => ({ ...prev, email: '' }));
                      }
                    }}
                    placeholder="Enter email address"
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      formErrors.email 
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                        : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'
                    }`}
                    disabled={isSubmitting}
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.email}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={newStudent.phone}
                    onChange={(e) => {
                      setNewStudent({ ...newStudent, phone: e.target.value });
                      if (formErrors.phone) {
                        setFormErrors(prev => ({ ...prev, phone: '' }));
                      }
                    }}
                    placeholder="Enter phone number"
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      formErrors.phone 
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                        : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'
                    }`}
                    disabled={isSubmitting}
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.phone}</p>
                  )}
                </div>

                {/* Student ID */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Student ID *
                  </label>
                  <input
                    type="text"
                    value={newStudent.studentId}
                    onChange={(e) => {
                      setNewStudent({ ...newStudent, studentId: e.target.value });
                      if (formErrors.studentId) {
                        setFormErrors(prev => ({ ...prev, studentId: '' }));
                      }
                    }}
                    placeholder="e.g., CSL-2024-004"
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      formErrors.studentId 
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                        : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'
                    }`}
                    disabled={isSubmitting}
                  />
                  {formErrors.studentId && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.studentId}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Address *
                  </label>
                  <textarea
                    value={newStudent.address}
                    onChange={(e) => {
                      setNewStudent({ ...newStudent, address: e.target.value });
                      if (formErrors.address) {
                        setFormErrors(prev => ({ ...prev, address: '' }));
                      }
                    }}
                    placeholder="Enter full address"
                    rows={3}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none ${
                      formErrors.address 
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                        : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'
                    }`}
                    disabled={isSubmitting}
                  />
                  {formErrors.address && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.address}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={newStudent.dateOfBirth}
                    onChange={(e) => {
                      setNewStudent({ ...newStudent, dateOfBirth: e.target.value });
                      if (formErrors.dateOfBirth) {
                        setFormErrors(prev => ({ ...prev, dateOfBirth: '' }));
                      }
                    }}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      formErrors.dateOfBirth 
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                        : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'
                    }`}
                    disabled={isSubmitting}
                  />
                  {formErrors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.dateOfBirth}</p>
                  )}
                </div>

                {/* Institution */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Home Institution
                  </label>
                  <input
                    type="text"
                    value={newStudent.institution}
                    onChange={(e) => {
                      setNewStudent({ ...newStudent, institution: e.target.value });
                      if (formErrors.institution) {
                        setFormErrors(prev => ({ ...prev, institution: '' }));
                      }
                    }}
                    placeholder="e.g., University of Nairobi"
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      formErrors.institution 
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                        : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'
                    }`}
                    disabled={isSubmitting}
                  />
                  {formErrors.institution && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.institution}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    The institution this student is attached from for training
                  </p>
                </div>

                {/* Profile Picture Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Profile Picture
                  </label>
                  <div className="flex items-center gap-4">
                    {/* Preview */}
                    <div className="h-20 w-20 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center border-2 border-slate-300 dark:border-slate-600">
                      {newStudent.profilePicture ? (
                        <img 
                          src={newStudent.profilePicture} 
                          alt="Preview" 
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <UserCircleIcon className="h-12 w-12 text-slate-400" />
                      )}
                    </div>
                    
                    {/* Upload Button */}
                    <div className="flex-1">
                      <input
                        type="file"
                        id="addProfilePicture"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Validate file size (max 5MB)
                            if (file.size > 5 * 1024 * 1024) {
                              setFormErrors(prev => ({ ...prev, profilePicture: 'Image must be less than 5MB' }));
                              return;
                            }
                            
                            // Convert to base64
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewStudent({ ...newStudent, profilePicture: reader.result as string });
                              if (formErrors.profilePicture) {
                                setFormErrors(prev => ({ ...prev, profilePicture: '' }));
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        disabled={isSubmitting}
                      />
                      <label
                        htmlFor="addProfilePicture"
                        className={`block w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-700 dark:text-slate-300 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors ${
                          formErrors.profilePicture 
                            ? 'border-red-300 dark:border-red-600' 
                            : 'border-slate-200 dark:border-slate-600'
                        } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {newStudent.profilePicture ? 'Change Photo' : 'Upload Photo'}
                      </label>
                      {newStudent.profilePicture && (
                        <button
                          type="button"
                          onClick={() => setNewStudent({ ...newStudent, profilePicture: '' })}
                          disabled={isSubmitting}
                          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors disabled:opacity-50"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                  {formErrors.profilePicture && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.profilePicture}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Optional: Upload a profile photo (JPG, PNG, max 5MB)
                  </p>
                </div>

                {/* Course Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Initial Course (Optional)
                  </label>
                  <select
                    value={newStudent.courseId}
                    onChange={(e) => {
                      setNewStudent({ ...newStudent, courseId: e.target.value });
                      if (formErrors.courseId) {
                        setFormErrors(prev => ({ ...prev, courseId: '' }));
                      }
                    }}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      formErrors.courseId 
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                        : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'
                    }`}
                    disabled={isSubmitting || isLoadingCourses}
                  >
                    <option value="">{isLoadingCourses ? 'Loading courses...' : 'No course selected'}</option>
                    {!isLoadingCourses && courses.filter(c => c.isActive).map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code} - {course.title}
                      </option>
                    ))}
                  </select>
                  {formErrors.courseId && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.courseId}</p>
                  )}
                </div>

                {/* Grade */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Current Grade
                  </label>
                  <select
                    value={newStudent.grade}
                    onChange={(e) => {
                      setNewStudent({ ...newStudent, grade: e.target.value });
                      if (formErrors.grade) {
                        setFormErrors(prev => ({ ...prev, grade: '' }));
                      }
                    }}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      formErrors.grade 
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                        : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'
                    }`}
                    disabled={isSubmitting}
                  >
                    <option value="">Not graded yet</option>
                    <option value="A">A - Excellent (90-100%)</option>
                    <option value="B">B - Good (80-89%)</option>
                    <option value="C">C - Satisfactory (70-79%)</option>
                    <option value="D">D - Pass (60-69%)</option>
                    <option value="F">F - Fail (Below 60%)</option>
                    <option value="I">I - Incomplete</option>
                    <option value="W">W - Withdrawn</option>
                  </select>
                  {formErrors.grade && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.grade}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Student's performance grade during the training attachment
                  </p>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Initial Status
                  </label>
                  <select
                    value={newStudent.status}
                    onChange={(e) => setNewStudent({ ...newStudent, status: e.target.value as 'active' | 'inactive' | 'suspended' })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={isSubmitting}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-slate-600">
                <button
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStudent}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Adding...
                    </>
                  ) : (
                    'Add Student'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Student Modal */}
      {showViewModal && selectedStudent && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseViewModal();
            }
          }}
        >
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Student Details</h2>
                <button 
                  onClick={handleCloseViewModal}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Student Info */}
              <div className="space-y-6">
                {/* Profile Section */}
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg overflow-hidden">
                    {selectedStudent.profilePicture ? (
                      <img 
                        src={selectedStudent.profilePicture} 
                        alt={selectedStudent.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="h-8 w-8 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{selectedStudent.name}</h3>
                    <p className="text-slate-600 dark:text-slate-400">{selectedStudent.email}</p>
                    <p className="text-slate-600 dark:text-slate-400">{selectedStudent.phone}</p>
                    <span className={`mt-2 inline-block ${getStatusBadge(selectedStudent.status)}`}>
                      {selectedStudent.status}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-800/50 p-4 rounded-xl border border-slate-200/50 dark:border-slate-600/30">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">Student ID</div>
                    <div className="font-bold text-slate-900 dark:text-white text-lg">{selectedStudent.studentId}</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200/50 dark:border-blue-600/30">
                    <div className="text-sm text-blue-600 dark:text-blue-400 mb-1 font-medium">Registration Date</div>
                    <div className="font-bold text-slate-900 dark:text-white">{selectedStudent.registrationDate}</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl border border-green-200/50 dark:border-green-600/30">
                    <div className="text-sm text-green-600 dark:text-green-400 mb-1 font-medium">Enrolled Courses</div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center text-2xl">
                      <AcademicCapIcon className="h-6 w-6 mr-2 text-green-500" />
                      <div className="flex flex-wrap gap-2">
                        {selectedStudent.enrolledCourses.map((course) => (
                          <span key={course.id} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-sm rounded-full font-medium">
                            {course.code}
                          </span>
                        ))}
                        {selectedStudent.enrolledCourses.length === 0 && (
                          <span className="text-slate-500 dark:text-slate-400 text-lg font-normal">No courses enrolled</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl border border-purple-200/50 dark:border-purple-600/30">
                    <div className="text-sm text-purple-600 dark:text-purple-400 mb-1 font-medium">Certificates</div>
                    <div className="font-bold text-slate-900 dark:text-white text-2xl">{selectedStudent.certificates}</div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-800/20 p-4 rounded-xl border border-orange-200/50 dark:border-orange-600/30">
                    <div className="text-sm text-amber-600 dark:text-amber-400 mb-1 font-medium">Last Active</div>
                    <div className="font-bold text-slate-900 dark:text-white">{selectedStudent.lastActive}</div>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 p-4 rounded-xl border border-indigo-200/50 dark:border-indigo-600/30">
                    <div className="text-sm text-indigo-600 dark:text-indigo-400 mb-1 font-medium">Date of Birth</div>
                    <div className="font-bold text-slate-900 dark:text-white">{selectedStudent.dateOfBirth || 'Not provided'}</div>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 p-4 rounded-xl border border-cyan-200/50 dark:border-cyan-600/30">
                    <div className="text-sm text-cyan-600 dark:text-cyan-400 mb-1 font-medium">Current Grade</div>
                    <div className="font-bold text-slate-900 dark:text-white text-2xl">
                      {selectedStudent.grade || 'Not graded'}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 p-4 rounded-xl border border-rose-200/50 dark:border-rose-600/30 col-span-2">
                    <div className="text-sm text-rose-600 dark:text-rose-400 mb-1 font-medium">Home Institution</div>
                    <div className="font-semibold text-slate-900 dark:text-white">{selectedStudent.institution || 'Not provided'}</div>
                  </div>
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-800/50 p-4 rounded-xl border border-slate-200/50 dark:border-slate-600/30 col-span-2">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">Address</div>
                    <div className="font-semibold text-slate-900 dark:text-white text-sm leading-relaxed">{selectedStudent.address}</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-600">
                  <button
                    onClick={() => {
                      handleCloseViewModal();
                      handleEditStudent(selectedStudent);
                    }}
                    className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Edit Student
                  </button>
                  <button
                    onClick={handleCloseViewModal}
                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && selectedStudent && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              handleCloseEditModal();
            }
          }}
        >
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 max-w-md w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Student</h2>
                <button 
                  onClick={handleCloseEditModal}
                  disabled={isSubmitting}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Error Banner for backend errors */}
              {uiError && (
                <div className="mb-4">
                  <ErrorBanner message={uiError} onClose={() => setUiError(null)} />
                </div>
              )}

              {/* Form */}
              <div className="space-y-4">
                {/* Student Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={editStudent.name}
                    onChange={(e) => {
                      setEditStudent({ ...editStudent, name: e.target.value });
                      if (formErrors.name) {
                        setFormErrors(prev => ({ ...prev, name: '' }));
                      }
                    }}
                    placeholder="Enter student's full name"
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      formErrors.name 
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                        : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'
                    }`}
                    disabled={isSubmitting}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={editStudent.email}
                    onChange={(e) => {
                      setEditStudent({ ...editStudent, email: e.target.value });
                      if (formErrors.email) {
                        setFormErrors(prev => ({ ...prev, email: '' }));
                      }
                    }}
                    placeholder="Enter email address"
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      formErrors.email 
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                        : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'
                    }`}
                    disabled={isSubmitting}
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.email}</p>
                  )}
                </div>

                {/* Student ID */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Student ID *
                  </label>
                  <input
                    type="text"
                    value={editStudent.studentId}
                    onChange={(e) => {
                      setEditStudent({ ...editStudent, studentId: e.target.value });
                      if (formErrors.studentId) {
                        setFormErrors(prev => ({ ...prev, studentId: '' }));
                      }
                    }}
                    placeholder="e.g., CSL-2024-004"
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      formErrors.studentId 
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                        : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'
                    }`}
                    disabled={isSubmitting}
                  />
                  {formErrors.studentId && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.studentId}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editStudent.phone}
                    onChange={(e) => {
                      setEditStudent({ ...editStudent, phone: e.target.value });
                      if (formErrors.phone) {
                        setFormErrors(prev => ({ ...prev, phone: '' }));
                      }
                    }}
                    placeholder="e.g., +1-555-0101"
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      formErrors.phone 
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                        : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'
                    }`}
                    disabled={isSubmitting}
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.phone}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Address
                  </label>
                  <textarea
                    value={editStudent.address}
                    onChange={(e) => {
                      setEditStudent({ ...editStudent, address: e.target.value });
                      if (formErrors.address) {
                        setFormErrors(prev => ({ ...prev, address: '' }));
                      }
                    }}
                    placeholder="Enter full address"
                    rows={2}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none ${
                      formErrors.address 
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                        : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'
                    }`}
                    disabled={isSubmitting}
                  />
                  {formErrors.address && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.address}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={editStudent.dateOfBirth}
                    onChange={(e) => {
                      setEditStudent({ ...editStudent, dateOfBirth: e.target.value });
                      if (formErrors.dateOfBirth) {
                        setFormErrors(prev => ({ ...prev, dateOfBirth: '' }));
                      }
                    }}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      formErrors.dateOfBirth 
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                        : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'
                    }`}
                    disabled={isSubmitting}
                  />
                  {formErrors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.dateOfBirth}</p>
                  )}
                </div>

                {/* Institution */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Home Institution *
                  </label>
                  <input
                    type="text"
                    value={editStudent.institution}
                    onChange={(e) => {
                      setEditStudent({ ...editStudent, institution: e.target.value });
                      if (formErrors.institution) {
                        setFormErrors(prev => ({ ...prev, institution: '' }));
                      }
                    }}
                    placeholder="e.g., University of Nairobi"
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      formErrors.institution 
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                        : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'
                    }`}
                    disabled={isSubmitting}
                  />
                  {formErrors.institution && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.institution}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    The institution this student is attached from for training
                  </p>
                </div>

                {/* Profile Picture Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Profile Picture
                  </label>
                  <div className="flex items-center gap-4">
                    {/* Preview */}
                    <div className="h-20 w-20 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center border-2 border-slate-300 dark:border-slate-600">
                      {editStudent.profilePicture ? (
                        <img 
                          src={editStudent.profilePicture} 
                          alt="Preview" 
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <UserCircleIcon className="h-12 w-12 text-slate-400" />
                      )}
                    </div>
                    
                    {/* Upload Button */}
                    <div className="flex-1">
                      <input
                        type="file"
                        id="editProfilePicture"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Validate file size (max 5MB)
                            if (file.size > 5 * 1024 * 1024) {
                              setFormErrors(prev => ({ ...prev, profilePicture: 'Image must be less than 5MB' }));
                              return;
                            }
                            
                            // Convert to base64
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setEditStudent({ ...editStudent, profilePicture: reader.result as string });
                              if (formErrors.profilePicture) {
                                setFormErrors(prev => ({ ...prev, profilePicture: '' }));
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        disabled={isSubmitting}
                      />
                      <label
                        htmlFor="editProfilePicture"
                        className={`block w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-700 dark:text-slate-300 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors ${
                          formErrors.profilePicture 
                            ? 'border-red-300 dark:border-red-600' 
                            : 'border-slate-200 dark:border-slate-600'
                        } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {editStudent.profilePicture ? 'Change Photo' : 'Upload Photo'}
                      </label>
                      {editStudent.profilePicture && (
                        <button
                          type="button"
                          onClick={() => setEditStudent({ ...editStudent, profilePicture: '' })}
                          disabled={isSubmitting}
                          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors disabled:opacity-50"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                  {formErrors.profilePicture && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.profilePicture}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Optional: Upload a profile photo (JPG, PNG, max 5MB)
                  </p>
                </div>

                {/* Grade */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Current Grade
                  </label>
                  <select
                    value={editStudent.grade}
                    onChange={(e) => {
                      setEditStudent({ ...editStudent, grade: e.target.value });
                      if (formErrors.grade) {
                        setFormErrors(prev => ({ ...prev, grade: '' }));
                      }
                    }}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      formErrors.grade 
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                        : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'
                    }`}
                    disabled={isSubmitting}
                  >
                    <option value="">Not graded yet</option>
                    <option value="A">A - Excellent (90-100%)</option>
                    <option value="B">B - Good (80-89%)</option>
                    <option value="C">C - Satisfactory (70-79%)</option>
                    <option value="D">D - Pass (60-69%)</option>
                    <option value="F">F - Fail (Below 60%)</option>
                    <option value="I">I - Incomplete</option>
                    <option value="W">W - Withdrawn</option>
                  </select>
                  {formErrors.grade && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.grade}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Student's performance grade during the training attachment
                  </p>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Status
                  </label>
                  <select
                    value={editStudent.status}
                    onChange={(e) => setEditStudent({ ...editStudent, status: e.target.value as 'active' | 'inactive' | 'suspended' })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={isSubmitting}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                {/* Enrolled Courses Management */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Enrolled Courses
                  </label>
                  
                  {/* Current Courses */}
                  <div className="space-y-2 mb-3">
                    {editStudent.enrolledCourses && editStudent.enrolledCourses.length > 0 ? (
                      editStudent.enrolledCourses.map((course) => (
                        <div 
                          key={course.id} 
                          className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-600 text-white">
                              {course.code}
                            </span>
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {course.title}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updatedCourses = editStudent.enrolledCourses.filter(c => c.id !== course.id);
                              setEditStudent({ ...editStudent, enrolledCourses: updatedCourses });
                            }}
                            disabled={isSubmitting}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove course"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400 italic p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                        No courses enrolled yet
                      </p>
                    )}
                  </div>

                  {/* Add New Course */}
                  <div className="flex gap-2">
                    <select
                      value={editStudent.courseId || ''}
                      onChange={(e) => setEditStudent({ ...editStudent, courseId: e.target.value })}
                      className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      disabled={isSubmitting}
                    >
                      <option value="">Select course to add...</option>
                      {courses
                        .filter(c => c.isActive && !editStudent.enrolledCourses.some(ec => ec.id === c.id))
                        .map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.code} - {course.title}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (editStudent.courseId) {
                          const selectedCourse = courses.find(c => c.id === parseInt(editStudent.courseId));
                          if (selectedCourse) {
                            const updatedCourses = [...editStudent.enrolledCourses, selectedCourse];
                            setEditStudent({ 
                              ...editStudent, 
                              enrolledCourses: updatedCourses,
                              courseId: ''
                            });
                            addToast('success', 'Course Added', `${selectedCourse.title} has been added`);
                          }
                        }
                      }}
                      disabled={!editStudent.courseId || isSubmitting}
                      className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-slate-600">
                <button
                  onClick={handleCloseEditModal}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditStudent}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Updating...
                    </>
                  ) : (
                    'Update Student'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Student"
        message={`Are you sure you want to delete "${studentToDelete?.name}"? This action cannot be undone and will remove all associated data.`}
        confirmLabel="Delete Student"
        cancelLabel="Cancel"
        onConfirm={confirmDeleteStudent}
        onCancel={cancelDeleteStudent}
        type="danger"
        isLoading={isDeleting}
      />

      {/* Toast Notifications */}
      <ToastContainer 
        toasts={toasts}
        onRemoveToast={removeToast}
      />
    </div>
    </>
  );
};

export default StudentsPage;

