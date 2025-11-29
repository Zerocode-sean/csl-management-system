import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Download
} from 'lucide-react';

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
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock data - replace with actual API calls
  const stats = [
    {
      title: 'Total Students',
      value: '1,247',
      icon: Users,
      change: '+12% from last month',
      changeType: 'positive' as const,
      trend: [45, 52, 48, 61, 58, 65, 72, 68, 75],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Active Courses',
      value: '24',
      icon: GraduationCap,
      change: '+2 new courses',
      changeType: 'positive' as const,
      trend: [20, 21, 19, 22, 21, 23, 24, 23, 24],
      color: 'from-emerald-500 to-teal-500'
    },
    {
      title: 'Certificates Issued',
      value: '856',
      icon: Award,
      change: '+48 this week',
      changeType: 'positive' as const,
      trend: [650, 680, 720, 750, 780, 810, 830, 845, 856],
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Active Sessions',
      value: '42',
      icon: Activity,
      change: '-3 from yesterday',
      changeType: 'negative' as const,
      trend: [38, 42, 45, 44, 46, 48, 45, 44, 42],
      color: 'from-amber-500 to-orange-500'
    }
  ];

  const recentActivity: RecentActivityItem[] = [
    {
      id: '1',
      type: 'certificate',
      title: 'Certificate Issued',
      description: 'John Doe - React Development Fundamentals',
      time: '2 hours ago',
      status: 'success'
    },
    {
      id: '2',
      type: 'student',
      title: 'New Student Registration',
      description: 'Sarah Johnson joined Advanced JavaScript',
      time: '4 hours ago',
      status: 'success'
    },
    {
      id: '3',
      type: 'course',
      title: 'Course Update Pending',
      description: 'TypeScript Masterclass requires approval',
      time: '6 hours ago',
      status: 'warning'
    },
    {
      id: '4',
      type: 'certificate',
      title: 'Certificate Verification',
      description: 'Verification request for cert #CSL-2024-001',
      time: '1 day ago',
      status: 'pending'
    }
  ];

  const quickActions = [
    {
      title: 'Add Student',
      description: 'Register new student',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      action: () => console.log('Navigate to add student')
    },
    {
      title: 'Issue Certificate',
      description: 'Create new certificate',
      icon: Award,
      color: 'from-emerald-500 to-teal-500',
      action: () => console.log('Navigate to issue certificate')
    },
    {
      title: 'Create Course',
      description: 'Add new course',
      icon: GraduationCap,
      color: 'from-purple-500 to-pink-500',
      action: () => console.log('Navigate to create course')
    },
    {
      title: 'Analytics',
      description: 'View detailed reports',
      icon: BarChart3,
      color: 'from-amber-500 to-orange-500',
      action: () => console.log('Navigate to analytics')
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
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
