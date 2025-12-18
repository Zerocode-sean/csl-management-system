import api from '../lib/api';

export interface DashboardOverview {
  active_students: number;
  active_courses: number;
  active_certificates: number;
  certificates_issued_today: number;
  verifications_today: number;
}

export interface RecentCertificate {
  csl_number: string;
  issue_date: string;
  student_name: string;
  title: string;
  code: string;
  issuer_name: string;
}

export interface IssuanceTrend {
  date: string;
  count: number;
}

export interface VerificationStat {
  date: string;
  total_attempts: number;
  successful_verifications: number;
}

export interface TopCourse {
  course_name: string;
  course_code: string;
  certificate_count: number;
}

export interface DashboardData {
  overview: DashboardOverview;
  recent_certificates: RecentCertificate[];
  issuance_trend: IssuanceTrend[];
  verification_stats: VerificationStat[];
  top_courses: TopCourse[];
}

class DashboardService {
  async getDashboardData() {
    const response = await api.get<{ success: boolean; data: DashboardData }>('/admin/dashboard');
    return response.data;
  }

  async getCertificateStats() {
    const response = await api.get('/certificates/stats');
    return response.data;
  }
}

export const dashboardService = new DashboardService();
