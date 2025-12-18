import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  AcademicCapIcon,
  QrCodeIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { verificationApi } from '../../lib/api';
import QRScanner from '../../components/QRScanner';

interface VerificationResult {
  isValid: boolean;
  certificate?: {
    certificateNumber: string;
    studentName: string;
    courseName: string;
    courseCode: string;
    instructor: string;
    issueDate: string;
    completionDate?: string;
    expiryDate?: string;
    grade?: string;
    institution: string;
    status: string;
    revokedAt?: string;
    verificationCount?: number;
  };
  error?: string;
}

const VerificationPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  // Auto-verify if CSL number is in URL (from QR scan)
  useEffect(() => {
    const cslFromUrl = searchParams.get('csl');
    if (cslFromUrl) {
      setVerificationCode(cslFromUrl);
      verifyCode(cslFromUrl);
    }
  }, [searchParams]);

  const verifyCode = async (code: string) => {
    setIsLoading(true);
    setResult(null);
    
    try {
      // Remove all spaces and trim the code
      const cleanCode = code.replace(/\s+/g, '').trim();
      const response = await verificationApi.verify(cleanCode);
      const data = response.data;

      if (data.success && data.data) {
        // Certificate exists (could be valid or revoked)
        const cert = data.data;
        setResult({
          isValid: cert.status === 'active',
          certificate: {
            certificateNumber: cert.csl_number || cleanCode,
            studentName: cert.student_name || 'Unknown',
            courseName: cert.course?.name || cert.course_name || 'Unknown Course',
            courseCode: cert.course?.code || cert.course_code || 'N/A',
            instructor: cert.issuer || 'EMESA Research',
            issueDate: cert.dates?.issue_date || cert.issue_date,
            completionDate: cert.dates?.completion_date || cert.completion_date,
            grade: cert.grade,
            institution: 'EMESA Research and Consultancy',
            status: cert.status,
            revokedAt: cert.dates?.revoked_at || cert.revoked_at,
            verificationCount: cert.verification_count
          }
        });
      } else {
        // Certificate not found
        setResult({
          isValid: false,
          error: data.message || 'Certificate not found or invalid verification code'
        });
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      
      // Handle 404 specifically
      if (error.response?.status === 404) {
        setResult({
          isValid: false,
          error: 'Certificate not found. Please check the CSL number and try again.'
        });
      } else {
        setResult({
          isValid: false,
          error: error.response?.data?.message || 'Failed to verify certificate. Please check your connection and try again.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) return;
    verifyCode(verificationCode);
  };

  const handleQRScan = (cslNumber: string) => {
    setShowScanner(false);
    setVerificationCode(cslNumber);
    setSearchParams({ csl: cslNumber });
    verifyCode(cslNumber);
  };

  const reset = () => {
    setVerificationCode('');
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-12">
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}
      
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
            Verify the authenticity of certificates issued by EMESA
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 mb-6">
          <form onSubmit={handleVerification} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Certificate Number (CSL Number)
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="e.g., 2025-CS101-0001-37B620"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors duration-200"
                  disabled={isLoading}
                />
              </div>
              <p className="mt-2 text-sm text-gray-400">
                Enter the CSL number found on the certificate
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isLoading || !verificationCode.trim()}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-all duration-200"
              >
                {isLoading ? 'Verifying...' : 'Verify Certificate'}
              </button>
              
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                disabled={isLoading}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all duration-200 flex items-center space-x-2"
                title="Scan QR Code"
              >
                <QrCodeIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Scan QR</span>
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
            {result.certificate ? (
              <div>
                {/* Success/Revoked Header */}
                <div className="flex items-center mb-6">
                  <div className={`h-12 w-12 ${
                    result.isValid ? 'bg-green-500/20' : 'bg-orange-500/20'
                  } rounded-full flex items-center justify-center mr-4`}>
                    {result.isValid ? (
                      <CheckCircleIcon className="h-8 w-8 text-green-400" />
                    ) : (
                      <ExclamationTriangleIcon className="h-8 w-8 text-orange-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {result.isValid ? 'Certificate Valid' : 'Certificate Revoked'}
                    </h3>
                    <p className={result.isValid ? 'text-green-400' : 'text-orange-400'}>
                      {result.isValid 
                        ? 'This certificate is authentic and verified' 
                        : 'This certificate has been revoked and is no longer valid'
                      }
                    </p>
                  </div>
                </div>

                {/* Certificate Details */}
                <div className="bg-white/5 rounded-xl p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <DocumentTextIcon className="h-5 w-5 text-indigo-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-400">CSL Number</p>
                        <p className="text-white font-medium font-mono">{result.certificate.certificateNumber}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center mt-1 ${
                        result.isValid ? 'bg-green-500/20' : 'bg-orange-500/20'
                      }`}>
                        <div className={`h-2 w-2 rounded-full ${
                          result.isValid ? 'bg-green-400' : 'bg-orange-400'
                        }`}></div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Status</p>
                        <p className={`font-medium uppercase ${
                          result.isValid ? 'text-green-400' : 'text-orange-400'
                        }`}>
                          {result.certificate.status}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <UserIcon className="h-5 w-5 text-indigo-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-400">Recipient</p>
                        <p className="text-white font-medium">{result.certificate.studentName}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <AcademicCapIcon className="h-5 w-5 text-indigo-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-400">Course</p>
                        <p className="text-white font-medium">{result.certificate.courseName}</p>
                        <p className="text-gray-400 text-sm">({result.certificate.courseCode})</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <CalendarIcon className="h-5 w-5 text-indigo-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-400">Issue Date</p>
                        <p className="text-white font-medium">
                          {new Date(result.certificate.issueDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {result.certificate.completionDate && (
                      <div className="flex items-start space-x-3">
                        <CalendarIcon className="h-5 w-5 text-indigo-400 mt-1" />
                        <div>
                          <p className="text-sm text-gray-400">Completion Date</p>
                          <p className="text-white font-medium">
                            {new Date(result.certificate.completionDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
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
                          Grade: {result.certificate.grade}
                        </span>
                      </div>
                    </div>
                  )}

                  {result.certificate.revokedAt && !result.isValid && (
                    <div className="pt-4 border-t border-white/10">
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                        <p className="text-sm text-gray-400 mb-1">Revoked On</p>
                        <p className="text-orange-400 font-medium">
                          {new Date(result.certificate.revokedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-white/10">
                    <p className="text-sm text-gray-400">
                      Issued by <span className="text-white font-medium">{result.certificate.institution}</span>
                    </p>
                    {result.certificate.verificationCount && (
                      <p className="text-xs text-gray-500 mt-1">
                        Verified {result.certificate.verificationCount} {result.certificate.verificationCount === 1 ? 'time' : 'times'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {result.isValid && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={() => window.open(`/api/v1/certificates/${result.certificate?.certificateNumber}/download`, '_blank')}
                      className="flex-1 min-w-[200px] bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                      <span>Download Certificate</span>
                    </button>
                  </div>
                )}
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
        <div className="text-center mt-8 space-y-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-gray-400 text-sm mb-2">
              <strong className="text-white">How to verify:</strong>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left text-sm text-gray-400">
              <div className="flex items-start space-x-2">
                <QrCodeIcon className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span>Scan the QR code on the certificate with your phone</span>
              </div>
              <div className="flex items-start space-x-2">
                <DocumentTextIcon className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span>Enter the CSL number manually from the certificate</span>
              </div>
            </div>
          </div>
          
          <p className="text-gray-400 text-sm">
            Need help or found a fraudulent certificate?{' '}
            <a href="mailto:verify@emesa.com" className="text-indigo-400 hover:text-indigo-300">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;
