import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

interface VerificationResult {
  isValid: boolean;
  certificate?: {
    certificateNumber: string;
    studentName: string;
    courseName: string;
    instructor: string;
    issueDate: string;
    expiryDate?: string;
    grade?: string;
    institution: string;
  };
  error?: string;
}

const VerificationPage: React.FC = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) return;

    setIsLoading(true);
    setResult(null);
    
    try {
      // Get backend URL from environment or use default
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
      
      // Call verification API endpoint (public, no auth required)
      const response = await fetch(`${apiUrl}/verification/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          csl_number: verificationCode.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success && data.data.valid) {
        // Certificate is valid
        const cert = data.data.certificate;
        setResult({
          isValid: true,
          certificate: {
            certificateNumber: cert.csl_number || verificationCode,
            studentName: cert.student_name || 'Unknown',
            courseName: cert.course_title || cert.course_name || 'Unknown Course',
            instructor: cert.issued_by || 'Director',
            issueDate: cert.issue_date || new Date().toISOString().split('T')[0],
            grade: cert.grade,
            institution: 'EMESA Research and Consultancy'
          }
        });
      } else {
        // Certificate not found or invalid
        setResult({
          isValid: false,
          error: data.data?.message || data.message || 'Certificate not found or invalid verification code'
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setResult({
        isValid: false,
        error: 'Failed to verify certificate. Please check your connection and try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setVerificationCode('');
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-2xl flex items-center justify-center">
              <ShieldCheckIcon className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Certificate Verification</h1>
          <p className="text-gray-300">
            Verify the authenticity of certificates issued by our system
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 mb-6">
          <form onSubmit={handleVerification} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Certificate Number or Verification Code
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter certificate number (e.g., CSL-2024-001) or verification code"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors duration-200"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isLoading || !verificationCode.trim()}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-all duration-200"
              >
                {isLoading ? 'Verifying...' : 'Verify Certificate'}
              </button>
              {result && (
                <button
                  type="button"
                  onClick={reset}
                  className="px-6 py-3 border border-white/20 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
            <p className="text-gray-300">Verifying certificate...</p>
          </div>
        )}

        {/* Verification Result */}
        {result && !isLoading && (
          <div className={`bg-white/10 backdrop-blur-md rounded-2xl border ${
            result.isValid ? 'border-green-500/30' : 'border-red-500/30'
          } p-8`}>
            {result.isValid && result.certificate ? (
              <div>
                {/* Success Header */}
                <div className="flex items-center mb-6">
                  <div className="h-12 w-12 bg-green-500/20 rounded-full flex items-center justify-center mr-4">
                    <CheckCircleIcon className="h-8 w-8 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Certificate Valid</h3>
                    <p className="text-green-400">This certificate is authentic and verified</p>
                  </div>
                </div>

                {/* Certificate Details */}
                <div className="bg-white/5 rounded-xl p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <DocumentTextIcon className="h-5 w-5 text-indigo-400" />
                      <div>
                        <p className="text-sm text-gray-400">Certificate Number</p>
                        <p className="text-white font-medium">{result.certificate.certificateNumber}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <UserIcon className="h-5 w-5 text-indigo-400" />
                      <div>
                        <p className="text-sm text-gray-400">Recipient</p>
                        <p className="text-white font-medium">{result.certificate.studentName}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <AcademicCapIcon className="h-5 w-5 text-indigo-400" />
                      <div>
                        <p className="text-sm text-gray-400">Course</p>
                        <p className="text-white font-medium">{result.certificate.courseName}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <UserIcon className="h-5 w-5 text-indigo-400" />
                      <div>
                        <p className="text-sm text-gray-400">Instructor</p>
                        <p className="text-white font-medium">{result.certificate.instructor}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <CalendarIcon className="h-5 w-5 text-indigo-400" />
                      <div>
                        <p className="text-sm text-gray-400">Issue Date</p>
                        <p className="text-white font-medium">
                          {new Date(result.certificate.issueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {result.certificate.expiryDate && (
                      <div className="flex items-center space-x-3">
                        <CalendarIcon className="h-5 w-5 text-indigo-400" />
                        <div>
                          <p className="text-sm text-gray-400">Expiry Date</p>
                          <p className="text-white font-medium">
                            {new Date(result.certificate.expiryDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {result.certificate.grade && (
                    <div className="pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Final Grade</span>
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                          {result.certificate.grade}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-white/10">
                    <p className="text-sm text-gray-400">
                      Issued by <span className="text-white font-medium">{result.certificate.institution}</span>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* Error Header */}
                <div className="flex items-center mb-6">
                  <div className="h-12 w-12 bg-red-500/20 rounded-full flex items-center justify-center mr-4">
                    <XCircleIcon className="h-8 w-8 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Certificate Not Found</h3>
                    <p className="text-red-400">The provided code could not be verified</p>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-300">{result.error}</p>
                </div>

                <div className="mt-4 text-sm text-gray-400">
                  <p>Please check that you have entered the correct certificate number or verification code.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            Need help? Contact our{' '}
            <a href="#" className="text-indigo-400 hover:text-indigo-300">
              support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;
