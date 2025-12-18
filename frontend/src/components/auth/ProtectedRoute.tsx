import React, { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'super_admin' | 'admin' | 'course_manager'
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, user, checkAuth, isLoading } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card-strong p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check role permissions
  if (requiredRole && user?.role) {
    const roleHierarchy = {
      'super_admin': 3,
      'admin': 2,
      'course_manager': 1,
    }

    const userRoleLevel = roleHierarchy[user.role]
    const requiredRoleLevel = roleHierarchy[requiredRole]

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="glass-card-strong p-8 text-center max-w-md">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Access Denied
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              You don't have permission to access this resource.
            </p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}

export default ProtectedRoute
