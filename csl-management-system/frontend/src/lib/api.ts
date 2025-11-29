import axios from 'axios'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

// Create axios instance
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const { authService } = require('../services/authService');
    const token = authService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status, data } = error.response || {}

    // Handle authentication errors
    if (status === 401) {
      useAuthStore.getState().logout()
      toast.error('Session expired. Please log in again.')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // Handle other errors
    if (status >= 400 && status < 500) {
      const message = data?.message || 'Request failed'
      toast.error(message)
    } else if (status >= 500) {
      toast.error('Server error. Please try again later.')
    } else if (!status) {
      toast.error('Network error. Please check your connection.')
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    api.post('/auth/login', credentials),
    
  logout: () =>
    api.post('/auth/logout'),
    
  verifyToken: () =>
    api.get('/auth/verify'),
    
  refreshToken: () =>
    api.post('/auth/refresh'),
}

// Students API
export const studentsApi = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    sortBy?: string; 
    sortOrder?: 'asc' | 'desc' 
  }) =>
    api.get('/students', { params }),
    
  getById: (id: string) =>
    api.get(`/students/${id}`),
    
  create: (data: {
    name: string;
    email: string;
    mobile?: string;
    address?: string;
    dateOfBirth?: string;
  }) =>
    api.post('/students', data),
    
  update: (id: string, data: Partial<{
    name: string;
    email: string;
    mobile?: string;
    address?: string;
    dateOfBirth?: string;
  }>) =>
    api.put(`/students/${id}`, data),
    
  delete: (id: string) =>
    api.delete(`/students/${id}`),
}

// Courses API
export const coursesApi = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    active?: boolean 
  }) =>
    api.get('/courses', { params }),
    
  getById: (id: string) =>
    api.get(`/courses/${id}`),
    
  create: (data: {
    code: string;
    title: string;
    description?: string;
    durationMonths?: number;
  }) =>
    api.post('/courses', data),
    
  update: (id: string, data: Partial<{
    code: string;
    title: string;
    description?: string;
    durationMonths?: number;
    isActive: boolean;
  }>) =>
    api.put(`/courses/${id}`, data),
    
  delete: (id: string) =>
    api.delete(`/courses/${id}`),
}

// Certificates API
export const certificatesApi = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    status?: string;
    courseId?: string;
    studentId?: string;
    startDate?: string;
    endDate?: string;
  }) =>
    api.get('/certificates', { params }),
    
  getById: (cslNumber: string) =>
    api.get(`/certificates/${cslNumber}`),
    
  issue: (data: {
    studentId: string;
    courseId: string;
    notes?: string;
  }) =>
    api.post('/certificates/issue', data),
    
  revoke: (cslNumber: string, data: {
    reason: string;
  }) =>
    api.post(`/certificates/${cslNumber}/revoke`, data),
    
  getStatistics: () =>
    api.get('/certificates/statistics'),
}

// Verification API (Public)
export const verificationApi = {
  verify: (cslNumber: string) =>
    api.get(`/verify/${cslNumber}`),
}

// Admins API
export const adminsApi = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    role?: string 
  }) =>
    api.get('/admins', { params }),
    
  getById: (id: string) =>
    api.get(`/admins/${id}`),
    
  create: (data: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'super_admin' | 'admin' | 'course_manager';
    mobile?: string;
  }) =>
    api.post('/admins', data),
    
  update: (id: string, data: Partial<{
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'super_admin' | 'admin' | 'course_manager';
    mobile?: string;
    isActive: boolean;
  }>) =>
    api.put(`/admins/${id}`, data),
    
  changePassword: (id: string, data: {
    currentPassword: string;
    newPassword: string;
  }) =>
    api.put(`/admins/${id}/password`, data),
    
  delete: (id: string) =>
    api.delete(`/admins/${id}`),
}

// Audit Logs API
export const auditApi = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
  }) =>
    api.get('/audit-logs', { params }),
}

export default api
