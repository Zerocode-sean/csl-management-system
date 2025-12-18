/**
 * Students API Service
 * Handles all API calls related to students
 * Updated: 2025-12-07 - Increased timeout to 30s for large image uploads
 */

import axios from 'axios';
import { authService } from './authService';

// Create axios instance with auth interceptor
// Use relative path - Vite proxy will forward /api/* to backend
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000, // 30 seconds for operations with large images
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
}

export interface Student {
  student_id?: number;
  student_custom_id?: string;
  name: string;
  email: string;
  mobile?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  home_institution?: string;
  current_grade?: string;
  profile_picture?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  // Course fields
  course_id?: number;
  course_code?: string;
  course_title?: string;
  // Computed fields from API
  courses?: number;
  certificates?: number;
  status?: 'active' | 'inactive' | 'graduated' | 'suspended';
  institution?: string;
  grade?: string;
}

export interface StudentsResponse {
  success: boolean;
  data: Student[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

export interface CoursesResponse {
  success: boolean;
  data: Course[];
  total?: number;
  message?: string;
}

class StudentsService {
  async getAllStudents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<StudentsResponse> {
    try {
      const response = await api.get('/students', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  }

  async getStudentById(id: number): Promise<{ success: boolean; data: Student; message?: string }> {
    try {
      const response = await api.get(`/students/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching student:', error);
      throw error;
    }
  }

  async createStudent(studentData: Partial<Student>): Promise<{ success: boolean; data: Student; message?: string }> {
    try {
      const response = await api.post('/students', studentData);
      return response.data;
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  }

  async updateStudent(id: number, studentData: Partial<Student>): Promise<{ success: boolean; data: Student; message?: string }> {
    try {
      const response = await api.put(`/students/${id}`, studentData);
      return response.data;
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  }

  async deleteStudent(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.delete(`/students/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  }

  // Get student's course enrollments and certificates
  async getStudentEnrollments(id: number): Promise<any> {
    try {
      const response = await api.get(`/students/${id}/enrollments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching student enrollments:', error);
      throw error;
    }
  }

  async getStudentCertificates(id: number): Promise<any> {
    try {
      const response = await api.get(`/students/${id}/certificates`);
      return response.data;
    } catch (error) {
      console.error('Error fetching student certificates:', error);
      throw error;
    }
  }

  async getProfilePicture(id: number): Promise<{ success: boolean; data: { profile_picture: string; size: number } }> {
    try {
      const response = await api.get(`/students/${id}/profile-picture`);
      return response.data;
    } catch (error) {
      console.error('Error fetching profile picture:', error);
      throw error;
    }
  }

  async getAllCourses(): Promise<CoursesResponse> {
    try {
      const response = await api.get('/courses');
      return response.data;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  }
}

export const studentsService = new StudentsService();
