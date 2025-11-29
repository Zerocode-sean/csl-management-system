/**
 * Students API Service
 * Handles all API calls related to students
 */

// Use proxy in development, direct URL in production
const API_BASE_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');

export interface Course {
  course_id: number; // Changed back to number (Integer)
  code: string; // Backend field name
  title: string; // Backend field name
  description?: string;
  duration_months?: number;
  is_active: boolean;
  // Frontend helpers (optional, can be mapped)
  id?: number;
}

export interface Student {
  student_id: string;
  student_custom_id?: string; // Custom student ID format (e.g., CSL-2024-001)
  first_name?: string;
  last_name?: string;
  name: string;
  email: string;
  mobile?: string;
  phone?: string; // Alias for mobile
  address?: string;
  date_of_birth?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  // Course fields
  course_id?: number | string;
  course_code?: string;
  course_title?: string;
  // Computed fields from API
  courses?: number;
  certificates?: number;
  status?: 'active' | 'inactive' | 'graduated' | 'suspended';
  institution?: string;
  profile_picture?: string;
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
  data: {
    courses: Course[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message?: string;
}

import { authService } from './authService';

class StudentsService {
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

  private baseUrl = `${API_BASE_URL}/api/v1/students`;

  async getAllStudents(params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<StudentsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.status && params.status !== 'all') searchParams.append('status', params.status);
    const url = `${this.baseUrl}?${searchParams.toString()}`;
    const response = await this.requestWithAuth(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const json = await response.json();

    // Backend returns { success: true, data: { students: [...], pagination: {...} } }
    // Normalize to StudentsResponse where data is an array of Student
    const studentsArray: Student[] = Array.isArray(json.data)
      ? json.data
      : (json.data?.students || []);

    return {
      success: json.success,
      data: studentsArray,
      pagination: json.data?.pagination,
      message: json.message
    };
  }

  async getStudentById(id: number): Promise<{ success: boolean; data: Student; message?: string }> {
    const response = await this.requestWithAuth(`${this.baseUrl}/${id}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  }

  async createStudent(studentData: Partial<Student>): Promise<{ success: boolean; data: Student; message?: string }> {
    const response = await this.requestWithAuth(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  }

  async updateStudent(id: number, studentData: Partial<Student>): Promise<{ success: boolean; data: Student; message?: string }> {
    const response = await this.requestWithAuth(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  }

  async deleteStudent(id: number): Promise<{ success: boolean; message?: string }> {
    const response = await this.requestWithAuth(`${this.baseUrl}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  }

  async getStudentEnrollments(id: number): Promise<any> {
    const response = await this.requestWithAuth(`${this.baseUrl}/${id}/enrollments`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  }

  async getStudentCertificates(id: number): Promise<any> {
    const response = await this.requestWithAuth(`${this.baseUrl}/${id}/certificates`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  }

  async getAllCourses(): Promise<CoursesResponse> {
    const response = await this.requestWithAuth(`${API_BASE_URL}/api/v1/courses`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  }
}

export const studentsService = new StudentsService();
