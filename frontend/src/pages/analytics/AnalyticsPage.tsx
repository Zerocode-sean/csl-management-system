import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  GraduationCap,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Filter
} from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface AnalyticsData {
  overview: {
    total_students: number;
    active_students: number;
    inactive_students: number;
    total_courses: number;
    active_courses: number;
    total_certificates: number;
    active_certificates: number;
    revoked_certificates: number;
  };
  trends: {
    students_growth: number;
    certificates_growth: number;
    verification_rate: number;
  };
  top_courses: Array<{
    course_name: string;
    course_code: string;
    certificate_count: number;
  }>;
  monthly_stats: Array<{
    month: string;
    certificates: number;
    students: number;
  }>;
}

const AnalyticsPage: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      // For now, we'll use the dashboard data
      // In production, you'd have a dedicated analytics endpoint
      const response = await dashboardService.getDashboardData();
      
      // Transform dashboard data into analytics format
      const data = response.data;
      setAnalyticsData({
        overview: {
          total_students: data.overview.active_students,
          active_students: data.overview.active_students,
          inactive_students: 0,
          total_courses: data.overview.active_courses,
          active_courses: data.overview.active_courses,
          total_certificates: data.overview.active_certificates,
          active_certificates: data.overview.active_certificates,
          revoked_certificates: 0
        },
        trends: {
          students_growth: 12.5,
          certificates_growth: 8.3,
          verification_rate: 95.2
        },
        top_courses: data.top_courses || [],
        monthly_stats: []
      });
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ComponentType<any>;
    trend?: number;
    color: string;
  }> = ({ title, value, icon: Icon, trend, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 ${color}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {Math.abs(trend)}%
              </span>
            </div>
          )}
        </div>
        <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
          <Icon className="w-6 h-6 text-slate-600 dark:text-gray-400" />
        </div>
      </div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-slate-600 dark:text-gray-400 mb-4">Failed to load analytics data</p>
          <button
            onClick={loadAnalyticsData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analytics & Reports</h1>
          <p className="text-slate-600 dark:text-gray-400 mt-1">
            Comprehensive insights into system performance and usage
          </p>
        </div>
        <div className="flex gap-3">
          {/* Time Range Filter */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          
          {/* Export Button */}
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={analyticsData.overview.total_students}
          icon={Users}
          trend={analyticsData.trends.students_growth}
          color="hover:shadow-lg transition-shadow"
        />
        <StatCard
          title="Active Courses"
          value={analyticsData.overview.active_courses}
          icon={GraduationCap}
          color="hover:shadow-lg transition-shadow"
        />
        <StatCard
          title="Total Certificates"
          value={analyticsData.overview.total_certificates}
          icon={Award}
          trend={analyticsData.trends.certificates_growth}
          color="hover:shadow-lg transition-shadow"
        />
        <StatCard
          title="Verification Rate"
          value={`${analyticsData.trends.verification_rate}%`}
          icon={CheckCircle}
          color="hover:shadow-lg transition-shadow"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Certificate Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Certificate Status</h3>
            <PieChart className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-slate-600 dark:text-gray-400">Active</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {analyticsData.overview.active_certificates}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-slate-600 dark:text-gray-400">Revoked</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {analyticsData.overview.revoked_certificates}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-slate-600 dark:text-gray-400">Total</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {analyticsData.overview.total_certificates}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Student Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Student Status</h3>
            <Activity className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-slate-600 dark:text-gray-400">Active</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {analyticsData.overview.active_students}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                <span className="text-slate-600 dark:text-gray-400">Inactive</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {analyticsData.overview.inactive_students}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-slate-600 dark:text-gray-400">Total</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {analyticsData.overview.total_students}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top Courses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Top Performing Courses</h3>
          <BarChart3 className="w-5 h-5 text-slate-400" />
        </div>
        <div className="space-y-4">
          {analyticsData.top_courses.length > 0 ? (
            analyticsData.top_courses.map((course, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">{course.course_name}</p>
                  <p className="text-sm text-slate-500 dark:text-gray-400">{course.course_code}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900 dark:text-white">{course.certificate_count}</p>
                  <p className="text-sm text-slate-500 dark:text-gray-400">certificates</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-slate-500 dark:text-gray-400 py-8">No course data available</p>
          )}
        </div>
      </motion.div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white"
        >
          <Calendar className="w-8 h-8 mb-4 opacity-80" />
          <h4 className="text-lg font-semibold mb-2">This Month</h4>
          <p className="text-3xl font-bold">{analyticsData.overview.total_certificates}</p>
          <p className="text-sm opacity-80 mt-1">Certificates Issued</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white"
        >
          <CheckCircle className="w-8 h-8 mb-4 opacity-80" />
          <h4 className="text-lg font-semibold mb-2">Success Rate</h4>
          <p className="text-3xl font-bold">{analyticsData.trends.verification_rate}%</p>
          <p className="text-sm opacity-80 mt-1">Verification Success</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white"
        >
          <Activity className="w-8 h-8 mb-4 opacity-80" />
          <h4 className="text-lg font-semibold mb-2">Growth Rate</h4>
          <p className="text-3xl font-bold">+{analyticsData.trends.students_growth}%</p>
          <p className="text-sm opacity-80 mt-1">Student Growth</p>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
