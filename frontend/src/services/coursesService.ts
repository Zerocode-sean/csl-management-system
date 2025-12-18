/**
 * Courses API Service
 * Handles all API calls related to courses
 */

import axios from 'axios';
import { authService } from './authService';

// Create axios instance with auth interceptor
// Use relative path - Vite proxy will forward /api/* to backend
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = authService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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
  // Additional UI fields
  instructor?: string;
  enrolledStudents?: number;
  maxStudents?: number;
  startDate?: string;
  endDate?: string;
  category?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  status?: 'active' | 'inactive' | 'draft' | 'archived';
  // Certificate-related fields
  certificate_count?: number;
  active_certificates?: number;
}

export interface CoursesResponse {
  success: boolean;
  data: Course[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

export interface CourseResponse {
  success: boolean;
  data: Course;
  message?: string;
}

class CoursesService {
  async getAllCourses(params?: {
    page?: number;
    limit?: number;
    search?: string;
    active?: boolean;
  }): Promise<CoursesResponse> {
    try {
      const response = await api.get('/courses', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  }

  async getCourse(id: number): Promise<CourseResponse> {
    try {
      const response = await api.get(`/courses/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching course:', error);
      throw error;
    }
  }

  async createCourse(course: Partial<Course>): Promise<CourseResponse> {
    try {
      const response = await api.post('/courses', course);
      return response.data;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  async updateCourse(id: number, course: Partial<Course>): Promise<CourseResponse> {
    try {
      const response = await api.put(`/courses/${id}`, course);
      return response.data;
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  }

  async deleteCourse(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`/courses/${id}`);
      return response.data;
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
