// Development Environment Configuration
export const DEV_CONFIG = {
  // Set to true to disable all API calls for frontend-only testing
  DISABLE_API_CALLS: false,
  
  // Mock data for development
  MOCK_USER: {
    id: '1',
    username: 'admin',
    email: 'admin@csl.com',
    role: 'admin' as const,
    firstName: 'Admin',
    lastName: 'User',
    isActive: true,
  },
  
  // Development API endpoints
  API_ENDPOINTS: {
    baseUrl: import.meta.env.DEV ? 'http://localhost:5001/api/v1' : '/api/v1',
    auth: '/auth',
    students: '/students',
    courses: '/courses',
    certificates: '/certificates',
  },
  
  // Development flags
  ENABLE_MOCK_AUTH: true,
  SHOW_DEBUG_INFO: false,
  SUPPRESS_API_ERRORS: true,
}

export const isDevelopment = import.meta.env.DEV
export const isProduction = import.meta.env.PROD
