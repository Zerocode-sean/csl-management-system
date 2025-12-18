import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api/v1';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  admin_id: string;
  username: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'course_manager';
  is_active: boolean;
  last_login_at?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    admin: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface VerifyResponse {
  success: boolean;
  data: User;
}

class AuthService {
  private readonly TOKEN_KEY = 'csl_access_token';
  private readonly REFRESH_TOKEN_KEY = 'csl_refresh_token';

  /**
   * Store tokens in localStorage (persistent across tabs and reloads)
   */
  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  /**
   * Get access token from localStorage
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get refresh token from localStorage
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Clear all tokens from storage
   */
  clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(
        `${API_BASE_URL}/auth/login`,
        credentials
      );

      if (response.data.success) {
        const { accessToken, refreshToken } = response.data.data;
        this.setTokens(accessToken, refreshToken);
      }

      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        const message = error.response.data.message || 'Login failed';
        const err = new Error(message) as any;
        if (error.response.data.data) {
          err.data = error.response.data.data;
        }
        throw err;
      }
      throw new Error('Network error. Please check your connection.');
    }
  }

  /**
   * Verify current token and get user data
   */
  async verifyToken(): Promise<User | null> {
    const token = this.getAccessToken();
    
    if (!token) {
      return null;
    }

    try {
      const response = await axios.get<VerifyResponse>(
        `${API_BASE_URL}/auth/verify`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data;
    } catch (error) {
      // Token is invalid or expired
      this.clearTokens();
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return null;
    }

    try {
      const response = await axios.post<{
        success: boolean;
        data: { accessToken: string; refreshToken: string };
      }>(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      if (response.data.success) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        this.setTokens(accessToken, newRefreshToken);
        return accessToken;
      }

      return null;
    } catch (error) {
      this.clearTokens();
      return null;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    const token = this.getAccessToken();

    // Call backend logout endpoint if token exists
    if (token) {
      try {
        await axios.post(
          `${API_BASE_URL}/auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (error) {
        // Ignore errors, clear tokens anyway
        console.error('Logout API call failed:', error);
      }
    }

    // Clear tokens from storage
    this.clearTokens();
  }
}

export const authService = new AuthService();
