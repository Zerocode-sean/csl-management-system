import { Routes, Route } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import { ThemeProvider } from './contexts/ThemeContext'

// Simple test app for login module only
function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">CSL System - Login Module Test</h1>
            <a href="/login" className="text-blue-500 underline">Go to Login</a>
          </div>
        } />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/success" element={
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold text-green-600">Login Successful!</h1>
            <p>Login module is working correctly.</p>
          </div>
        } />
      </Routes>
    </ThemeProvider>
  )
}

export default App
