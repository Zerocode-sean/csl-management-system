import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  EyeIcon, 
  ArrowDownTrayIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  XCircleIcon,
  AcademicCapIcon,
  CalendarIcon,
  UserIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { certificatesService, type Certificate } from '../../services/certificatesService';
import { studentsService } from '../../services/studentsService';
import { coursesService } from '../../services/coursesService';
import toast from 'react-hot-toast';

const CertificatesPage: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Modal states
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  
  // Issue certificate form
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [issueForm, setIssueForm] = useState({
    student_id: '',
    course_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    completion_date: new Date().toISOString().split('T')[0],
    grade: ''
  });
  
  // Revoke form
  const [revokeReason, setRevokeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load certificates
  const loadCertificates = async () => {
    try {
      setLoading(true);
      const response = await certificatesService.getAllCertificates(
        currentPage, 
        10, 
        selectedStatus
      );
      setCertificates(response.data.certificates);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load certificates');
      console.error('Error loading certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load students and courses for issue modal
  const loadStudentsAndCourses = async () => {
    try {
      const [studentsRes, coursesRes] = await Promise.all([
        studentsService.getAllStudents({ limit: 100 }),
        coursesService.getAllCourses({ limit: 100, active: true })
      ]);
      console.log('Students loaded:', studentsRes.data);
      console.log('Courses loaded:', coursesRes.data);
      
      // Extract arrays from response objects
      const studentsArray = Array.isArray(studentsRes.data) 
        ? studentsRes.data 
        : (studentsRes.data as any).students || [];
      const coursesArray = Array.isArray(coursesRes.data)
        ? coursesRes.data
        : (coursesRes.data as any).courses || [];
      
      console.log('Students array sample:', studentsArray[0]);
      console.log('Courses array sample:', coursesArray[0]);
      console.log('Total students:', studentsArray.length);
      console.log('Total courses:', coursesArray.length);
      
      if (studentsArray.length === 0) {
        toast.error('No students found. Please add students first.');
      }
      
      if (coursesArray.length === 0) {
        toast.error('No courses found. Please add courses first.');
      }
      
      setStudents(studentsArray);
      setCourses(coursesArray);
    } catch (error: any) {
      toast.error('Failed to load students/courses: ' + (error.message || 'Unknown error'));
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    loadCertificates();
  }, [currentPage, selectedStatus]);

  // Filter certificates by search term
  const filteredCertificates = certificates.filter(cert => 
    cert.csl_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.course_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle issue certificate
  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!issueForm.student_id || !issueForm.course_id) {
      toast.error('Please select student and course');
      return;
    }

    console.log('Form values before parsing:', {
      student_id: issueForm.student_id,
      course_id: issueForm.course_id,
      student_id_type: typeof issueForm.student_id,
      course_id_type: typeof issueForm.course_id
    });

    const parsedStudentId = parseInt(issueForm.student_id, 10);
    const parsedCourseId = parseInt(issueForm.course_id, 10);

    console.log('Parsed values:', {
      parsedStudentId,
      parsedCourseId,
      isStudentIdValid: !isNaN(parsedStudentId) && parsedStudentId > 0,
      isCourseIdValid: !isNaN(parsedCourseId) && parsedCourseId > 0
    });

    if (isNaN(parsedStudentId) || parsedStudentId <= 0 || isNaN(parsedCourseId) || parsedCourseId <= 0) {
      const errorMsg = `Invalid IDs detected:\nStudent ID: "${issueForm.student_id}" → ${parsedStudentId}\nCourse ID: "${issueForm.course_id}" → ${parsedCourseId}\n\nPlease select valid options from the dropdowns.`;
      toast.error('Invalid student or course ID. Please select valid options.');
      console.error(errorMsg);
      alert(errorMsg);
      setIsSubmitting(false);
      return;
    }

    try {
      setIsSubmitting(true);
      await certificatesService.issueCertificate({
        student_id: parsedStudentId,
        course_id: parsedCourseId,
        issue_date: issueForm.issue_date
      });
      
      // Show success message
      toast.success('Certificate issued successfully!');
      
      // Close modal and reset form
      setShowIssueModal(false);
      setIssueForm({
        student_id: '',
        course_id: '',
        issue_date: new Date().toISOString().split('T')[0],
        completion_date: new Date().toISOString().split('T')[0],
        grade: ''
      });
      
      // Show loading toast while refreshing
      toast.loading('Refreshing certificates list...', { id: 'refresh-certificates' });
      
      // Reload certificates list to show the newly issued certificate
      await loadCertificates();
      
      // Dismiss loading toast
      toast.dismiss('refresh-certificates');
    } catch (error: any) {
      toast.error(error.message || 'Failed to issue certificate');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle view certificate
  const handleViewCertificate = async (cert: Certificate) => {
    try {
      const response = await certificatesService.getCertificateByCslNumber(cert.csl_number);
      setSelectedCertificate(response.data.certificate);
      setShowViewModal(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load certificate details');
    }
  };

  // Handle download PDF
  const handleDownloadPdf = async (cslNumber: string) => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf-download' });
      const blob = await certificatesService.downloadCertificatePdf(cslNumber);
      certificatesService.triggerDownload(blob, `certificate_${cslNumber}.pdf`);
      toast.success('PDF downloaded successfully!', { id: 'pdf-download' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to download PDF', { id: 'pdf-download' });
    }
  };

  // Handle revoke certificate
  const handleRevokeCertificate = async () => {
    if (!selectedCertificate || !revokeReason.trim()) {
      toast.error('Please provide a revocation reason');
      return;
    }

    try {
      setIsSubmitting(true);
      await certificatesService.revokeCertificate(
        selectedCertificate.csl_number,
        revokeReason
      );
      
      // Show success message
      toast.success('Certificate revoked successfully');
      
      // Close modal and reset state
      setShowRevokeModal(false);
      setRevokeReason('');
      setSelectedCertificate(null);
      
      // Show loading toast while refreshing
      toast.loading('Refreshing certificates list...', { id: 'refresh-certificates' });
      
      // Reload certificates list to reflect the revoked status
      await loadCertificates();
      
      // Dismiss loading toast
      toast.dismiss('refresh-certificates');
    } catch (error: any) {
      toast.error(error.message || 'Failed to revoke certificate');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open issue modal
  const openIssueModal = () => {
    loadStudentsAndCourses();
    setShowIssueModal(true);
  };

  // Open revoke modal
  const openRevokeModal = (cert: Certificate) => {
    setSelectedCertificate(cert);
    setShowRevokeModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Modern Header with Gradient */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                Certificates Management
              </h1>
              <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5" />
                Issue, verify, and manage student certificates
              </p>
            </div>
          </div>
        </div>

        {/* Modern Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Certificates</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{total}</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {certificates.filter(c => c.status === 'active').length}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                <CheckBadgeIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Revoked</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {certificates.filter(c => c.status === 'revoked').length}
                </p>
              </div>
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100">Issue Certificate</p>
                <button
                  onClick={openIssueModal}
                  className="mt-2 text-sm font-semibold hover:underline flex items-center gap-1"
                >
                  <PlusIcon className="h-4 w-4" />
                  Create New
                </button>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <ShieldCheckIcon className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Modern Filters Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search with icon */}
            <div className="relative flex-1 w-full max-w-md">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search CSL, student, or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 transition-all"
              />
            </div>

            <div className="flex gap-3 w-full lg:w-auto">
              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-slate-900 dark:text-slate-100 transition-all"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="revoked">Revoked</option>
                <option value="expired">Expired</option>
              </select>

              {/* Issue Certificate Button */}
              <button
                onClick={openIssueModal}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 font-semibold"
              >
                <PlusIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Issue Certificate</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modern Certificates Table */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-t-4 border-blue-500 dark:border-blue-400 mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400 font-medium text-lg">Loading certificates...</p>
                <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">Please wait</p>
              </div>
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="p-16 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="bg-slate-100 dark:bg-slate-700 rounded-full p-6 mb-4">
                  <DocumentTextIcon className="h-16 w-16 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-slate-900 dark:text-white font-semibold text-xl mb-2">
                  {certificates.length === 0 ? 'No certificates issued yet' : 'No certificates found'}
                </p>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  {certificates.length === 0 
                    ? 'Start by issuing your first certificate to a student'
                    : 'Try adjusting your search or filter criteria'}
                </p>
                <button
                  onClick={openIssueModal}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 font-semibold flex items-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  Issue First Certificate
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Certificate
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Issue Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredCertificates.map((cert) => (
                      <tr key={cert.csl_number} className="hover:bg-slate-50 dark:hover:bg-slate-700/70 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg mr-3 shadow-md">
                              <ShieldCheckIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900 dark:text-white">
                                {cert.csl_number}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">CSL Number</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="bg-slate-100 dark:bg-slate-700 rounded-full p-2 mr-3">
                              <UserIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900 dark:text-white">{cert.student_name || 'N/A'}</div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">{cert.student_email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <AcademicCapIcon className="h-5 w-5 text-indigo-500 dark:text-indigo-400 mr-2" />
                            <div>
                              <div className="text-sm font-semibold text-slate-900 dark:text-white">{cert.course_title || 'N/A'}</div>
                              <div className="text-xs text-slate-600 dark:text-slate-400">Code: {cert.course_code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                            <CalendarIcon className="h-4 w-4 mr-2 text-slate-500 dark:text-slate-500" />
                            {new Date(cert.issue_date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                            cert.status === 'active' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                              : cert.status === 'revoked'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300'
                          }`}>
                            {cert.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {cert.grade || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewCertificate(cert)}
                              className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all"
                              title="View Details"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(cert.csl_number)}
                              className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-all"
                              title="Download PDF"
                            >
                              <ArrowDownTrayIcon className="h-5 w-5" />
                            </button>
                            {cert.status === 'active' && (
                              <button
                                onClick={() => openRevokeModal(cert)}
                                className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                                title="Revoke Certificate"
                              >
                                <XCircleIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Modern Pagination */}
              {totalPages > 1 && (
                <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 dark:border-slate-700">
                  <div className="mb-4 sm:mb-0">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      Showing <span className="font-bold text-blue-600 dark:text-blue-400">{(currentPage - 1) * 10 + 1}</span> to{' '}
                      <span className="font-bold text-blue-600 dark:text-blue-400">{Math.min(currentPage * 10, total)}</span> of{' '}
                      <span className="font-bold text-blue-600 dark:text-blue-400">{total}</span> certificates
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-slate-700 dark:text-slate-300 font-medium"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              currentPage === page
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-slate-700 dark:text-slate-300 font-medium"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
          </>
        )}
      </div>
      
      {/* Modern Issue Certificate Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full shadow-2xl transform transition-all">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <ShieldCheckIcon className="h-8 w-8" />
                Issue New Certificate
              </h2>
              <p className="text-blue-100 text-sm mt-1">Create and issue a new certificate to a student</p>
            </div>
            <form onSubmit={handleIssueCertificate} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    Student *
                  </label>
                  <select
                    value={issueForm.student_id}
                    onChange={(e) => setIssueForm({...issueForm, student_id: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-slate-900 dark:text-white transition-all"
                    required
                  >
                    <option value="">Select a student</option>
                    {students.map(student => {
                      // CRITICAL: Must use integer student_id from database, NOT custom ID
                      const studentId = student.student_id;
                      
                      if (!studentId || typeof studentId !== 'number') {
                        console.error('❌ INVALID STUDENT ID:', { 
                          student_id: studentId,
                          type: typeof studentId,
                          student_custom_id: student.student_custom_id,
                          full_object: student
                        });
                      } else {
                        console.log('✓ Valid student option:', { 
                          student_id: studentId,
                          type: typeof studentId,
                          name: student.name
                        });
                      }
                      
                      return (
                        <option key={studentId} value={studentId}>
                          {student.name} ({student.email})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <AcademicCapIcon className="h-4 w-4" />
                    Course *
                  </label>
                  <select
                    value={issueForm.course_id}
                    onChange={(e) => setIssueForm({...issueForm, course_id: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-slate-900 dark:text-white transition-all"
                    required
                  >
                    <option value="">Select a course</option>
                    {courses.map(course => {
                      // CRITICAL: Must use integer course_id from database, NOT course code
                      const courseId = course.course_id;
                      
                      if (!courseId || typeof courseId !== 'number') {
                        console.error('❌ INVALID COURSE ID:', { 
                          course_id: courseId,
                          type: typeof courseId,
                          code: course.code,
                          full_object: course
                        });
                      } else {
                        console.log('✓ Valid course option:', { 
                          course_id: courseId,
                          type: typeof courseId,
                          title: course.title,
                          code: course.code
                        });
                      }
                      
                      return (
                        <option key={courseId} value={courseId}>
                          {course.title} ({course.code})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Issue Date *
                    </label>
                    <input
                      type="date"
                      value={issueForm.issue_date}
                      onChange={(e) => setIssueForm({...issueForm, issue_date: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-slate-900 dark:text-white transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Completion Date *
                    </label>
                    <input
                      type="date"
                      value={issueForm.completion_date}
                      onChange={(e) => setIssueForm({...issueForm, completion_date: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-slate-900 dark:text-white transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <CheckBadgeIcon className="h-4 w-4" />
                    Grade (Optional)
                  </label>
                  <input
                    type="text"
                    value={issueForm.grade}
                    onChange={(e) => setIssueForm({...issueForm, grade: e.target.value})}
                    placeholder="e.g., A+, 95%, Excellent"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all font-semibold"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Issuing...' : 'Issue Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern View Certificate Modal */}
      {showViewModal && selectedCertificate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl sticky top-0">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <DocumentTextIcon className="h-8 w-8" />
                Certificate Details
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">CSL Number</p>
                <p className="font-mono font-bold text-lg text-blue-600 dark:text-blue-400">{selectedCertificate.csl_number}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                    <UserIcon className="h-3 w-3" />
                    Student
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white">{selectedCertificate.student_name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{selectedCertificate.student_email}</p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                    <AcademicCapIcon className="h-3 w-3" />
                    Course
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white">{selectedCertificate.course_title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Code: {selectedCertificate.course_code}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Issue Date</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {new Date(selectedCertificate.issue_date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Status</p>
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                    selectedCertificate.status === 'active' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  }`}>
                    {selectedCertificate.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Grade</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{selectedCertificate.grade || '-'}</p>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleDownloadPdf(selectedCertificate.csl_number)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold flex items-center justify-center gap-2"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  Download PDF
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Revoke Certificate Modal */}
      {showRevokeModal && selectedCertificate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-red-600 to-rose-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <XCircleIcon className="h-8 w-8" />
                Revoke Certificate
              </h2>
              <p className="text-red-100 text-sm mt-1">This action cannot be undone</p>
            </div>
            <div className="p-6">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl mb-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Certificate to revoke</p>
                <p className="font-mono font-bold text-red-600 dark:text-red-400">{selectedCertificate.csl_number}</p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Revocation Reason *</label>
                <textarea
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="Enter the reason for revoking this certificate..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRevokeModal(false);
                    setRevokeReason('');
                  }}
                  className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all font-semibold"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevokeCertificate}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || !revokeReason.trim()}
                >
                  {isSubmitting ? 'Revoking...' : 'Revoke'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default CertificatesPage;
