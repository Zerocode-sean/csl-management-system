import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  EyeIcon, 
  ArrowDownTrayIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

interface Certificate {
  id: string;
  certificateNumber: string;
  studentName: string;
  studentId: string;
  courseName: string;
  instructor: string;
  issueDate: string;
  expiryDate?: string;
  status: 'active' | 'revoked' | 'expired';
  grade?: string;
  verificationCode: string;
}

const CertificatesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  // Mock data - replace with actual API calls
  const certificates: Certificate[] = [
    {
      id: '1',
      certificateNumber: 'CSL-2024-001',
      studentName: 'John Doe',
      studentId: 'STU-001',
      courseName: 'React Development Fundamentals',
      instructor: 'Dr. Jane Smith',
      issueDate: '2024-03-15',
      expiryDate: '2026-03-15',
      status: 'active',
      grade: 'A+',
      verificationCode: 'VER-ABC123'
    },
    {
      id: '2',
      certificateNumber: 'CSL-2024-002',
      studentName: 'Sarah Johnson',
      studentId: 'STU-002',
      courseName: 'Advanced JavaScript Patterns',
      instructor: 'Prof. John Doe',
      issueDate: '2024-03-10',
      expiryDate: '2026-03-10',
      status: 'active',
      grade: 'A',
      verificationCode: 'VER-DEF456'
    },
    {
      id: '3',
      certificateNumber: 'CSL-2024-003',
      studentName: 'Mike Chen',
      studentId: 'STU-003',
      courseName: 'TypeScript Masterclass',
      instructor: 'Dr. Sarah Wilson',
      issueDate: '2024-02-28',
      status: 'revoked',
      grade: 'B+',
      verificationCode: 'VER-GHI789'
    }
  ];

  const filteredCertificates = certificates.filter(certificate => {
    const matchesSearch = certificate.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         certificate.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         certificate.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         certificate.verificationCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || certificate.status === selectedStatus;
    
    // Date range filtering
    let matchesDate = true;
    if (dateRange !== 'all') {
      const issueDate = new Date(certificate.issueDate);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateRange) {
        case 'week':
          matchesDate = daysDiff <= 7;
          break;
        case 'month':
          matchesDate = daysDiff <= 30;
          break;
        case 'quarter':
          matchesDate = daysDiff <= 90;
          break;
        case 'year':
          matchesDate = daysDiff <= 365;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-500/20 text-green-400 border border-green-500/30`;
      case 'revoked':
        return `${baseClasses} bg-red-500/20 text-red-400 border border-red-500/30`;
      case 'expired':
        return `${baseClasses} bg-gray-500/20 text-gray-400 border border-gray-500/30`;
      default:
        return baseClasses;
    }
  };

  const getGradeBadge = (grade?: string) => {
    if (!grade) return undefined;
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";

    if (grade.startsWith('A')) {
      return `${baseClasses} bg-emerald-500/20 text-emerald-400 border border-emerald-500/30`;
    } else if (grade.startsWith('B')) {
      return `${baseClasses} bg-blue-500/20 text-blue-400 border border-blue-500/30`;
    } else if (grade.startsWith('C')) {
      return `${baseClasses} bg-orange-500/20 text-orange-400 border border-orange-500/30`;
    } else {
      return `${baseClasses} bg-gray-500/20 text-gray-400 border border-gray-500/30`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Certificates</h1>
          <p className="text-gray-300 mt-1">Manage issued certificates and verification</p>
        </div>
        <button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200">
          <PlusIcon className="h-5 w-5" />
          <span>Issue Certificate</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-300">Total Issued</p>
              <p className="text-lg font-bold text-white">{certificates.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <ShieldCheckIcon className="h-6 w-6 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-300">Active</p>
              <p className="text-lg font-bold text-white">
                {certificates.filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-300">Revoked</p>
              <p className="text-lg font-bold text-white">
                {certificates.filter(c => c.status === 'revoked').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-300">This Month</p>
              <p className="text-lg font-bold text-white">12</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search certificates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors duration-200"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-indigo-400 transition-colors duration-200"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="revoked">Revoked</option>
            <option value="expired">Expired</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-indigo-400 transition-colors duration-200"
          >
            <option value="all">All Time</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/20">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Certificate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Issue Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredCertificates.map((certificate) => (
                <tr key={certificate.id} className="hover:bg-white/5 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center justify-center">
                        <DocumentTextIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">{certificate.certificateNumber}</div>
                        <div className="text-sm text-gray-400">{certificate.verificationCode}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 text-indigo-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-white">{certificate.studentName}</div>
                        <div className="text-sm text-gray-400">{certificate.studentId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-white">{certificate.courseName}</div>
                      <div className="text-sm text-gray-400 flex items-center">
                        <AcademicCapIcon className="h-3 w-3 mr-1" />
                        {certificate.instructor}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {certificate.grade && (
                      <span className={getGradeBadge(certificate.grade)}>
                        {certificate.grade}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(certificate.status)}>
                      {certificate.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1 text-indigo-400" />
                      {new Date(certificate.issueDate).toLocaleDateString()}
                    </div>
                    {certificate.expiryDate && (
                      <div className="text-xs text-gray-500 mt-1">
                        Expires: {new Date(certificate.expiryDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200">
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button className="text-green-400 hover:text-green-300 transition-colors duration-200">
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </button>
                      <button className="text-blue-400 hover:text-blue-300 transition-colors duration-200">
                        <ShieldCheckIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCertificates.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-white">No certificates found</h3>
            <p className="mt-1 text-sm text-gray-400">
              {searchTerm ? 'Try adjusting your search criteria' : 'Get started by issuing your first certificate'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificatesPage;
