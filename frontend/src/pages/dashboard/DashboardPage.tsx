import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  GraduationCap, 
  Award,
  CheckCircle,
  AlertTriangle,
  Clock,
  Activity,
  BarChart3,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Download,
  Search
} from 'lucide-react';
import { dashboardService, DashboardData } from '../../services/dashboardService';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  trend?: number[];
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeType = 'neutral',
  trend = [],
  color
}) => {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="group relative overflow-hidden"
    >
      <div className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-700/50 p-6 transition-all duration-300 shadow-lg hover:shadow-xl ${color}`}>
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/5 dark:to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{title}</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
            </div>
            <div className={`p-3 rounded-xl bg-gradient-to-br shadow-lg ${color}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Trend indicator */}
          {change && (
            <div className="flex items-center gap-2 mb-3">
              {changeType === 'positive' ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : changeType === 'negative' ? (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              ) : null}
              <span className={`text-sm font-medium ${
                changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 
                changeType === 'negative' ? 'text-red-600 dark:text-red-400' : 
                'text-slate-600 dark:text-slate-400'
              }`}>
                {change}
              </span>
            </div>
          )}

          {/* Mini trend chart */}
          {trend.length > 0 && (
            <div className="h-8 flex items-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
              {trend.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ height: 0 }}
                  animate={{ height: `${(point / Math.max(...trend)) * 100}%` }}
                  transition={{ delay: index * 0.05 }}
                  className="flex-1 bg-current rounded-sm min-h-1"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

interface RecentActivityItem {
  id: string;
  type: 'certificate' | 'student' | 'course';
  title: string;
  description: string;
  time: string;
  status: 'success' | 'warning' | 'pending';
}

const ActivityItem: React.FC<{ item: RecentActivityItem; index: number }> = ({ item, index }) => {
  const getStatusIcon = () => {
    switch (item.status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (item.status) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-700';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700';
      case 'pending':
        return 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700';
      default:
        return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ x: 4 }}
      className="group"
    >
      <div className="flex items-start gap-4 p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-800/70 border border-white/20 dark:border-slate-700/50 transition-all duration-200">
        <div className={`flex-shrink-0 p-2 rounded-lg ${getStatusColor()}`}>
          {getStatusIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {item.title}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 truncate mt-1">
            {item.description}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {item.time}
          </p>
        </div>
        <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all">
          <Eye className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        </button>
      </div>
    </motion.div>
  );
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<'all' | 'students' | 'courses' | 'certificates'>('all');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await dashboardService.getDashboardData();
      setDashboardData(response.data);
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
      // Set empty data to prevent infinite loading
      setDashboardData({
        overview: {
          active_students: 0,
          active_courses: 0,
          active_certificates: 0,
          certificates_issued_today: 0,
          verifications_today: 0
        },
        recent_certificates: [],
        issuance_trend: [],
        verification_stats: [],
        top_courses: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-slate-600 dark:text-gray-400 mb-4">Failed to load dashboard data</p>
          <button 
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { overview, recent_certificates, issuance_trend } = dashboardData;

  // Calculate trends from issuance_trend data
  const trendData = issuance_trend.map(t => Number.parseInt(t.count.toString()));
  const recentTrend = trendData.slice(-7); // Last 7 days

  // Calculate percentage changes
  const calculateChange = (current: number, previous: number): { value: string; type: 'positive' | 'negative' } => {
    if (previous === 0) return { value: '+100%', type: 'positive' as const };
    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? '+' : '';
    return {
      value: `${sign}${change.toFixed(1)}%`,
      type: change >= 0 ? 'positive' as const : 'negative' as const
    };
  };

  // Get change for certificates issued today vs average
  const avgDailyIssuance = trendData.length > 0 
    ? trendData.reduce((a, b) => a + b, 0) / trendData.length 
    : 0;
  const todayChange = calculateChange(overview.certificates_issued_today, avgDailyIssuance);

  const stats = [
    {
      title: 'Total Students',
      value: overview.active_students.toLocaleString(),
      icon: Users,
      change: `${overview.active_students} active`,
      changeType: 'neutral' as const,
      trend: [], // Can add student growth trend if available
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Active Courses',
      value: overview.active_courses.toString(),
      icon: GraduationCap,
      change: `${overview.active_courses} available`,
      changeType: 'neutral' as const,
      trend: [],
      color: 'from-emerald-500 to-teal-500'
    },
    {
      title: 'Certificates Issued',
      value: overview.active_certificates.toLocaleString(),
      icon: Award,
      change: `${overview.certificates_issued_today} today`,
      changeType: todayChange.type,
      trend: recentTrend,
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Verifications Today',
      value: overview.verifications_today.toString(),
      icon: Activity,
      change: `${overview.verifications_today} requests`,
      changeType: 'neutral' as const,
      trend: [],
      color: 'from-amber-500 to-orange-500'
    }
  ];

  // Convert recent certificates to activity items
  const recentActivity = recent_certificates.slice(0, 4).map((cert) => ({
    id: cert.csl_number,
    type: 'certificate' as const,
    title: 'Certificate Issued',
    description: `${cert.student_name} - ${cert.title} (${cert.code})`,
    time: formatTimeAgo(new Date(cert.issue_date)),
    status: 'success' as const
  }));

  function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    // Navigate to appropriate page based on category
    switch (searchCategory) {
      case 'students':
        navigate(`/students?search=${encodeURIComponent(searchQuery)}`);
        break;
      case 'courses':
        navigate(`/courses?search=${encodeURIComponent(searchQuery)}`);
        break;
      case 'certificates':
        navigate(`/certificates?search=${encodeURIComponent(searchQuery)}`);
        break;
      default:
        // Search all - go to students by default
        navigate(`/students?search=${encodeURIComponent(searchQuery)}`);
        toast('Searching in students...', { icon: 'ℹ️' });
    }
  };

  const quickActions = [
    {
      title: 'Add Student',
      description: 'Register new student',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      action: () => navigate('/students')
    },
    {
      title: 'Issue Certificate',
      description: 'Create new certificate',
      icon: Award,
      color: 'from-emerald-500 to-teal-500',
      action: () => navigate('/certificates')
    },
    {
      title: 'Create Course',
      description: 'Add new course',
      icon: GraduationCap,
      color: 'from-purple-500 to-pink-500',
      action: () => navigate('/courses')
    },
    {
      title: 'Analytics',
      description: 'View detailed reports',
      icon: BarChart3,
      color: 'from-amber-500 to-orange-500',
      action: () => navigate('/reports')
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Dashboard Overview
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Welcome back! Here's what's happening with your CSL management system.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-slate-600 dark:text-slate-400">Current Time</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {currentTime.toLocaleTimeString()}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
            >
              <Download className="w-4 h-4" />
              Export Report
            </motion.button>
          </div>
        </div>

        {/* Search Bar */}
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="flex-1 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students, courses, or certificates..."
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value as any)}
              className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="all">All</option>
              <option value="students">Students</option>
              <option value="courses">Courses</option>
              <option value="certificates">Certificates</option>
            </select>
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
          >
            Search
          </motion.button>
        </motion.form>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            change={stat.change}
            changeType={stat.changeType}
            trend={stat.trend}
            color={stat.color}
          />
        ))}
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Activity - Takes up 2 columns */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-2"
        >
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-700/50 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Activity</h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
              >
                View All
              </motion.button>
            </div>
            <div className="space-y-3">
              {recentActivity.map((item, index) => (
                <ActivityItem key={item.id} item={item} index={index} />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {/* Quick Actions Card */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-700/50 p-6 shadow-lg">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((action, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={action.action}
                  className={`group relative overflow-hidden bg-gradient-to-r ${action.color} p-4 rounded-xl text-left transition-all duration-300 shadow-lg hover:shadow-xl`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{action.title}</p>
                      <p className="text-xs text-white/80">{action.description}</p>
                    </div>
                    <Plus className="w-4 h-4 text-white/60 group-hover:text-white group-hover:rotate-90 transition-all" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;
