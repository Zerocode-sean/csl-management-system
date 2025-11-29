/**
 * Courses API Service
 * Handles all API calls related to courses
 */

// Use proxy in development, direct URL in production
const API_BASE_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');

export interface Course {
  course_id: number;
  code: string;
  title: string;
  description?: string;
  duration_months?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  // Statistics from backend
  certificate_count?: number;
  active_certificates?: number;
  // Additional UI fields
  instructor?: string;
  enrolledStudents?: number;
  maxStudents?: number;
  startDate?: string;
  endDate?: string;
  category?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  status?: 'active' | 'inactive' | 'draft' | 'archived';
}

export interface CoursesResponse {
  success: boolean;
  data: Course[] | {
    courses: Course[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message?: string;
}

export interface CourseResponse {
  success: boolean;
  data: Course;
  message?: string;
}

import { authService } from './authService';

class CoursesService {
  private baseUrl = `${API_BASE_URL}/api/v1/courses`;

  // Helper to perform fetch with auth and auto‑refresh on 401
  private async requestWithAuth(input: RequestInfo, init?: RequestInit): Promise<Response> {
    // First attempt with current token
    let response = await fetch(input, { ...(init || {}), headers: { ...(init?.headers || {}), ...(await this.buildHeaders()) } });
    if (response.status === 401) {
      // Try to refresh token and retry once
      const newAccess = await authService.refreshToken();
      if (newAccess) {
        response = await fetch(input, { ...(init || {}), headers: { ...(init?.headers || {}), ...(await this.buildHeaders()) } });
      }
    }
    return response;
  }

  // Build headers including Authorization if token exists
  private async buildHeaders(): Promise<HeadersInit> {
    const token = authService.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async getAllCourses(params?: {
    page?: number;
    limit?: number;
    search?: string;
    active?: boolean;
  }): Promise<CoursesResponse> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.search) searchParams.append('search', params.search);
      if (params?.active !== undefined) searchParams.append('active', params.active.toString());

      const url = searchParams.toString() ? `${this.baseUrl}?${searchParams}` : this.baseUrl;
      const response = await this.requestWithAuth(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  }

  async getCourse(id: number): Promise<CourseResponse> {
    try {
      const response = await this.requestWithAuth(`${this.baseUrl}/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching course:', error);
      throw error;
    }
  }

  async createCourse(course: Partial<Course>): Promise<CourseResponse> {
    try {
      const response = await this.requestWithAuth(this.baseUrl, {
        method: 'POST',
        body: JSON.stringify(course),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  async updateCourse(id: number, course: Partial<Course>): Promise<CourseResponse> {
    try {
      const response = await this.requestWithAuth(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(course),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  }

  async deleteCourse(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.requestWithAuth(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  }

  async getActiveCoursesForDropdown(): Promise<CoursesResponse> {
    return this.getAllCourses({ active: true, limit: 100 });
  }
}

// Export singleton instance
export const coursesService = new CoursesService();
export default coursesService;
