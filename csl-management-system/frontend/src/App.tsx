import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'

// Components
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import StudentsPage from './pages/students/StudentsPage'
import CertificatesPage from './pages/certificates/CertificatesPage'
import CoursesPage from './pages/courses/CoursesPage'
import SettingsPage from './pages/settings/SettingsPage'
import DashboardLayout from './components/layout/DashboardLayout'
import { Toaster } from 'react-hot-toast'

function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

  // Check authentication status on app load
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
        />
        
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        <Route 
          path="/students" 
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <StudentsPage />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        <Route 
          path="/certificates" 
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <CertificatesPage />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        <Route 
          path="/courses" 
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <CoursesPage />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        <Route 
          path="/settings" 
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <SettingsPage />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        <Route path="*" element={
          <div className="p-8 text-center">
            <h2 className="text-xl font-bold text-red-600">404 - Page Not Found</h2>
            <a href="/" className="text-blue-500 underline">Go Home</a>
          </div>
        } />
      </Routes>
    </div>
  )
}

export default App
