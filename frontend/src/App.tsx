import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Components
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import StudentsPage from './pages/students/StudentsPage'
import CoursesPage from './pages/courses/CoursesPage'
import CertificatesPage from './pages/certificates/CertificatesPage'
import SettingsPage from './pages/settings/SettingsPage'
import AnalyticsPage from './pages/analytics/AnalyticsPage'
import VerificationPage from './pages/public/VerificationPage'
import DashboardLayout from './components/layout/DashboardLayout'

function App() {
  const { isAuthenticated, isLoading } = useAuthStore()

  // Show loading state
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
      <Routes>
        {/* Public Routes */}
        <Route path="/verify" element={<VerificationPage />} />
        
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
        
        <Route 
          path="/reports" 
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <AnalyticsPage />
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
