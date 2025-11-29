import { create } from 'zustand'
import { authService, type User as ApiUser } from '../services/authService'

// Transform API user to store user format
const transformUser = (apiUser: ApiUser) => ({
  id: apiUser.admin_id,
  username: apiUser.username,
  email: apiUser.email,
  role: apiUser.role,
  firstName: apiUser.name?.split(' ')[0] || '',
  lastName: apiUser.name?.split(' ')[1] || '',
  isActive: apiUser.is_active
})

export interface User {
  id: string
  username: string
  email: string
  role: 'super_admin' | 'admin' | 'course_manager'
  firstName: string
  lastName: string
  isActive: boolean
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (credentials: { email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start with true to check auth on load
  error: null,

  login: async (credentials: { email: string; password: string }) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await authService.login(credentials)
      
      if (response.success) {
        const user = transformUser(response.data.admin)
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        })
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please try again.'
      set({ 
        isLoading: false, 
        error: errorMessage,
        isAuthenticated: false,
        user: null
      })
      throw new Error(errorMessage)
    }
  },

  logout: async () => {
    set({ isLoading: true })
    
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      })
    }
  },

  setUser: (user: User) => {
    set({ user, isAuthenticated: true })
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  },

  setError: (error: string | null) => {
    set({ error })
  },

  checkAuth: async () => {
    set({ isLoading: true })
    
    try {
      const apiUser = await authService.verifyToken()
      
      if (apiUser) {
        const user = transformUser(apiUser)
        set({ 
          user, 
          isAuthenticated: true, 
          isLoading: false,
          error: null
        })
      } else {
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false,
          error: null
        })
      }
    } catch (error) {
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: null
      })
    }
  },
}))
