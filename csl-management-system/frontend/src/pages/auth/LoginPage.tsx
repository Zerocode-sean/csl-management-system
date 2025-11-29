import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Eye, EyeOff, Lock, User, Shield, AlertTriangle, Clock } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const loginSchema = yup.object().shape({
  email: yup.string().email('Please enter a valid email').required('Email is required'),
  password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
})

interface LoginForm {
  email: string
  password: string
}

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0)
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  // Rate limiting logic - matches backend settings
  const MAX_ATTEMPTS = 3 // Backend allows 3 attempts before locking
  const LOCK_DURATION = 30 * 60 // 30 minutes in seconds (matches backend)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isLocked && lockTimeRemaining > 0) {
      interval = setInterval(() => {
        setLockTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsLocked(false)
            setFailedAttempts(0)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isLocked, lockTimeRemaining])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: yupResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    if (isLocked) {
      const minutes = Math.ceil(lockTimeRemaining / 60)
      toast.error(`Account temporarily locked. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`)
      return
    }

    setIsLoading(true)
    
    try {
      // Call the auth store login method
      await login(data)
      
      // Reset failed attempts on successful login
      setFailedAttempts(0)
      setIsLocked(false)
      
      toast.success('🎉 Login successful! Welcome to CSL Management System.')
      navigate('/dashboard')
    } catch (error: any) {
      // Handle failed login attempts
      let newFailedAttempts = failedAttempts + 1;
      
      // Use backend data if available
      if (error.data && typeof error.data.failedAttempts === 'number') {
        newFailedAttempts = error.data.failedAttempts;
      }
      
      setFailedAttempts(newFailedAttempts)
      
      if (newFailedAttempts >= MAX_ATTEMPTS) {
        setIsLocked(true)
        setLockTimeRemaining(LOCK_DURATION)
        toast.error(`🚫 Too many failed attempts! Account locked for 30 minutes for security.`)
      } else {
        const remainingAttempts = MAX_ATTEMPTS - newFailedAttempts
        const errorMessage = error.message || 'Invalid email or password'
        toast.error(`❌ ${errorMessage}. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left side - Gradient/Logo */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800"></div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-bounce" style={{ animationDuration: '3s' }}></div>
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-indigo-400/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/30"
            >
              <Shield className="w-12 h-12 text-white" />
            </motion.div>
            
            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-4xl font-bold mb-4"
            >
              CSL Management
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-xl text-white/80 mb-8"
            >
              Comprehensive School Management System
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="space-y-3 text-white/70"
            >
              <p className="flex items-center justify-center gap-2">
                <User className="w-5 h-5" />
                Student Management
              </p>
              <p className="flex items-center justify-center gap-2">
                <Shield className="w-5 h-5" />
                Certificate Issuance
              </p>
              <p className="flex items-center justify-center gap-2">
                <Lock className="w-5 h-5" />
                Secure Administration
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 lg:flex-none lg:w-96 xl:w-[480px] flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo (shows only on small screens) */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">CSL Management</h1>
            <p className="text-gray-600">Sign in to your administrator account</p>
          </div>

          <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
            {/* Header (desktop only) */}
            <div className="hidden lg:block text-center mb-8">
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-gray-900 mb-2"
              >
                Welcome Back
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600"
              >
                Sign in to your administrator account
              </motion.p>
            </div>

            {/* Rate limiting warning */}
            {failedAttempts > 0 && !isLocked && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-2"
              >
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">
                  {failedAttempts} failed attempt{failedAttempts > 1 ? 's' : ''}. 
                  {MAX_ATTEMPTS - failedAttempts} remaining before lockout.
                </span>
              </motion.div>
            )}

            {/* Account locked warning */}
            {isLocked && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-2"
              >
                <Clock className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">
                  Account locked for {lockTimeRemaining} seconds due to too many failed attempts.
                </span>
              </motion.div>
            )}

            {/* Login Form */}
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="Enter your email"
                    disabled={isLocked}
                    className={`w-full pl-11 pr-4 py-3 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      errors.email 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-red-500 text-sm mt-1"
                  >
                    {errors.email.message}
                  </motion.p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    disabled={isLocked}
                    className={`w-full pl-11 pr-11 py-3 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      errors.password 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLocked}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-red-500 text-sm mt-1"
                  >
                    {errors.password.message}
                  </motion.p>
                )}
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={!isLoading && !isLocked ? { scale: 1.02 } : {}}
                whileTap={!isLoading && !isLocked ? { scale: 0.98 } : {}}
                type="submit"
                disabled={isLoading || isLocked}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  isLoading || isLocked
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </>
                ) : isLocked ? (
                  <>
                    <Clock className="w-5 h-5" />
                    Locked ({Math.ceil(lockTimeRemaining / 60)}m)
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Sign In
                  </>
                )}
              </motion.button>
            </motion.form>

            {/* Development Notice */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <p className="text-xs text-blue-700 text-center mb-2 font-medium">
                Development Mode - Test Credentials:
              </p>
              <div className="text-xs font-mono text-blue-600 space-y-1">
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="font-semibold">admin@csl.com</span>
                </div>
                <div className="flex justify-between">
                  <span>Password:</span>
                  <span className="font-semibold">Admin@2025</span>
                </div>
              </div>
            </motion.div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 text-center"
            >
              <p className="text-xs text-gray-500">
                © 2025 CSL Management System. All rights reserved.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default LoginPage
