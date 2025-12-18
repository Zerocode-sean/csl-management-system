import React, { useState } from 'react';
import { MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface VerificationResult {
  valid: boolean;
  message: string;
  certificate?: {
    csl_number: string;
    issue_date: string;
    status: string;
    student_name: string;
    course_name: string;
    course_code: string;
    issued_by_name: string;
  };
}

const CertificateVerificationPage: React.FC = () => {
  const [serialNumber, setSerialNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serialNumber.trim()) {
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch(`http://localhost:5001/api/v1/certificates/verify/${serialNumber.trim()}`);
      const data = await response.json();
      
      if (data.success) {
        setVerificationResult(data.data);
      } else {
        setVerificationResult({
          valid: false,
          message: data.error || 'Verification failed'
        });
      }
    } catch (error) {
      setVerificationResult({
        valid: false,
        message: 'Failed to connect to verification service'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Certificate Verification</h1>
          <p className="text-xl text-slate-300">Verify the authenticity of CSL certificates</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
          <form onSubmit={handleVerification} className="mb-8">
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="serialNumber" className="block text-sm font-medium text-slate-200 mb-2">
                  Certificate Serial Number
                </label>
                <input
                  type="text"
                  id="serialNumber"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="Enter certificate serial number (e.g., 2025-WD-0001-ABC123)"
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isVerifying || !serialNumber.trim()}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white font-medium rounded-xl transition-colors duration-200 flex items-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <MagnifyingGlassIcon className="h-5 w-5" />
                      Verify
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {verificationResult && (
            <div className="mt-8">
              <div className={`rounded-xl p-6 ${
                verificationResult.valid 
                  ? 'bg-green-500/20 border border-green-500/30' 
                  : 'bg-red-500/20 border border-red-500/30'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  {verificationResult.valid ? (
                    <CheckCircleIcon className="h-8 w-8 text-green-400" />
                  ) : (
                    <XCircleIcon className="h-8 w-8 text-red-400" />
                  )}
                  <div>
                    <h3 className={`text-xl font-semibold ${
                      verificationResult.valid ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {verificationResult.valid ? 'Certificate Verified' : 'Verification Failed'}
                    </h3>
                    <p className={`${
                      verificationResult.valid ? 'text-green-200' : 'text-red-200'
                    }`}>
                      {verificationResult.message}
                    </p>
                  </div>
                </div>

                {verificationResult.valid && verificationResult.certificate && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-slate-300">Student Name</label>
                        <p className="text-white font-semibold">{verificationResult.certificate.student_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-300">Course</label>
                        <p className="text-white font-semibold">{verificationResult.certificate.course_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-300">Course Code</label>
                        <p className="text-white font-semibold">{verificationResult.certificate.course_code}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-slate-300">Certificate ID</label>
                        <p className="text-white font-semibold font-mono">{verificationResult.certificate.csl_number}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-300">Issue Date</label>
                        <p className="text-white font-semibold">{formatDate(verificationResult.certificate.issue_date)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-300">Issued By</label>
                        <p className="text-white font-semibold">{verificationResult.certificate.issued_by_name}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-400">
            Having trouble verifying a certificate? Contact us at{' '}
            <a href="mailto:verify@csl.edu" className="text-red-400 hover:text-red-300 transition-colors">
              verify@csl.edu
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CertificateVerificationPage;
