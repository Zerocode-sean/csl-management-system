import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { ThemeProvider } from './contexts/ThemeContext'

// Pages
import LoginPage from './pages/auth/LoginPage'
import VerificationPage from './pages/public/VerificationPage'
import NotFoundPage from './pages/error/NotFoundPage'
import DashboardPage from './pages/dashboard/DashboardPage'

// Components
import ProtectedRoute from './components/auth/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'
import AuthTest from './components/AuthTest'

function App() {
  const { isAuthenticated, isLoading } = useAuthStore()

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-white/20 border-t-white rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading CSL System</h2>
          <p className="text-gray-300">Please wait while we initialize...</p>
        </div>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<VerificationPage />} />
        <Route path="/verify" element={<VerificationPage />} />
        <Route path="/test" element={<AuthTest />} />
        
        {/* Authentication Route */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <LoginPage />
          } 
        />

        {/* Protected Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <Routes>
                <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/dashboard" element={
                  <MainLayout title="Dashboard">
                    <DashboardPage />
                  </MainLayout>
                } />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ThemeProvider>
  )
}

export default App
