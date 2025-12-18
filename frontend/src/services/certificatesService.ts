import api from '../lib/api'

export interface Certificate {
  csl_number: string
  student_id: number
  course_id: number
  issue_date: string
  completion_date: string
  grade?: string
  status: 'active' | 'revoked' | 'expired'
  pdf_url?: string
  revoked_at?: string
  revoked_by_admin_id?: number
  revocation_reason?: string
  issued_by_admin_id: number
  created_at: string
  updated_at: string
  
  // Joined data
  student_name?: string
  student_email?: string
  student_phone?: string
  course_title?: string
  course_code?: string
  issuer_name?: string
  revoker_name?: string
}

export interface IssueCertificateData {
  student_id: number
  course_id: number
  issue_date: string
}

export interface CertificatesResponse {
  success: boolean
  data: {
    certificates: Certificate[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface SingleCertificateResponse {
  success: boolean
  data: {
    certificate: Certificate
  }
}

export interface IssueCertificateResponse {
  success: boolean
  message: string
  data: {
    certificate: Certificate
  }
}

export interface RevokeCertificateResponse {
  success: boolean
  message: string
  data: {
    certificate: Certificate
  }
}

class CertificatesService {
  /**
   * Get all certificates with pagination
   */
  async getAllCertificates(page = 1, limit = 10, status?: string): Promise<CertificatesResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      
      if (status && status !== 'all') {
        params.append('status', status)
      }

      const response = await api.get(`/certificates?${params.toString()}`)
      return response.data
    } catch (error: any) {
      console.error('Error fetching certificates:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch certificates')
    }
  }

  /**
   * Get certificate by CSL number
   */
  async getCertificateByCslNumber(cslNumber: string): Promise<SingleCertificateResponse> {
    try {
      const response = await api.get(`/certificates/csl/${cslNumber}`)
      return response.data
    } catch (error: any) {
      console.error('Error fetching certificate:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch certificate')
    }
  }

  /**
   * Issue a new certificate
   */
  async issueCertificate(data: IssueCertificateData): Promise<IssueCertificateResponse> {
    try {
      // Certificate generation with Puppeteer can take 10-15 seconds
      const response = await api.post('/certificates', data, {
        timeout: 60000, // 60 seconds for PDF generation with logo embedding
      })
      return response.data
    } catch (error: any) {
      console.error('Error issuing certificate:', error)
      throw new Error(error.response?.data?.message || 'Failed to issue certificate')
    }
  }

  /**
   * Download certificate PDF
   */
  async downloadCertificatePdf(cslNumber: string): Promise<Blob> {
    try {
      const response = await api.get(`/certificates/${cslNumber}/download`, {
        responseType: 'blob'
      })
      return response.data
    } catch (error: any) {
      console.error('Error downloading certificate:', error)
      throw new Error(error.response?.data?.message || 'Failed to download certificate')
    }
  }

  /**
   * Revoke a certificate
   */
  async revokeCertificate(cslNumber: string, reason: string): Promise<RevokeCertificateResponse> {
    try {
      const response = await api.patch(`/certificates/csl/${cslNumber}/revoke`, {
        revocation_reason: reason
      })
      return response.data
    } catch (error: any) {
      console.error('Error revoking certificate:', error)
      throw new Error(error.response?.data?.message || 'Failed to revoke certificate')
    }
  }

  /**
   * Verify certificate (public endpoint)
   */
  async verifyCertificate(cslNumber: string): Promise<SingleCertificateResponse> {
    try {
      const response = await api.get(`/certificates/verify/${cslNumber}`)
      return response.data
    } catch (error: any) {
      console.error('Error verifying certificate:', error)
      throw new Error(error.response?.data?.message || 'Certificate verification failed')
    }
  }

  /**
   * Helper function to trigger file download
   */
  triggerDownload(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
}

export const certificatesService = new CertificatesService()
