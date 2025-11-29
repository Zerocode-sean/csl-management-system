import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  Users, 
  Award, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  User, 
  Bell,
  Search,
  Moon,
  Sun,
  Shield,
  GraduationCap
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

interface NavigationItem {
  name: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: Home },
  { name: 'Students', path: '/students', icon: Users, badge: 3 },
  { name: 'Courses', path: '/courses', icon: GraduationCap, badge: 5 },
  { name: 'Certificates', path: '/certificates', icon: Award, badge: 12 },
  { name: 'Settings', path: '/settings', icon: Settings },
]

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isCurrentPath = (path: string) => location.pathname === path

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Mobile sidebar backdrop */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <motion.div
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col z-50"
        >
          <div className="flex grow flex-col overflow-y-auto bg-white/10 backdrop-blur-md border-r border-white/20 px-6 py-6">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">CSL Manager</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Admin Portal</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-1 flex-col space-y-2">
              {navigation.map((item) => {
                const isActive = isCurrentPath(item.path)
                return (
                  <motion.button
                    key={item.name}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(item.path)}
                    className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-left font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-white/20 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-red-500 text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </motion.button>
                )
              })}
            </nav>

            {/* User section */}
            <div className="mt-auto pt-6 border-t border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {user?.firstName || 'Admin'} {user?.lastName || 'User'}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 capitalize">
                    {user?.role || 'Administrator'}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDarkMode(!darkMode)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-r border-white/20 z-50 lg:hidden"
            >
              <div className="flex h-full flex-col px-6 py-6">
                {/* Mobile header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-slate-900 dark:text-white">CSL Manager</h1>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Admin Portal</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-700 dark:text-slate-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex flex-1 flex-col space-y-2">
                  {navigation.map((item) => {
                    const isActive = isCurrentPath(item.path)
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          navigate(item.path)
                          setSidebarOpen(false)
                        }}
                        className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-left font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-white/20 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-red-500 text-white'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </nav>

                {/* Mobile User section */}
                <div className="mt-auto pt-6 border-t border-white/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {user?.firstName || 'Admin'} {user?.lastName || 'User'}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 capitalize">
                        {user?.role || 'Administrator'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div className="lg:pl-72">
          {/* Top bar */}
          <div className="sticky top-0 z-30 bg-white/10 backdrop-blur-md border-b border-white/20">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>

                {/* Search bar */}
                <div className="hidden sm:block relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="relative p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-700 dark:text-slate-300 transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                </button>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
