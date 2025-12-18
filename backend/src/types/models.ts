/**
 * Database Models and Interfaces for CSL Management System
 */

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  INSTRUCTOR = 'instructor',
  STUDENT = 'student',
  VIEWER = 'viewer'
}

export interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: Date;
  address?: string;
  enrollment_date: Date;
  graduation_date?: Date;
  status: StudentStatus;
  user_id?: number;
  created_at: Date;
  updated_at: Date;
}

export enum StudentStatus {
  ACTIVE = 'active',
  GRADUATED = 'graduated',
  SUSPENDED = 'suspended',
  WITHDRAWN = 'withdrawn'
}

export interface Course {
  id: number;
  course_code: string;
  course_name: string;
  description?: string;
  credits: number;
  duration_hours: number;
  instructor_id?: number;
  category: string;
  prerequisites?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Certificate {
  id: number;
  certificate_number: string;
  csl_number: string;
  student_id: number;
  course_id: number;
  issue_date: Date;
  completion_date: Date;
  grade?: string;
  gpa?: number;
  status: CertificateStatus;
  issued_by: number;
  verification_hash: string;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

export enum CertificateStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  SUSPENDED = 'suspended',
  EXPIRED = 'expired'
}

export interface AuditLog {
  id: number;
  user_id?: number;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  timestamp: Date;
}

export interface Enrollment {
  id: number;
  student_id: number;
  course_id: number;
  enrollment_date: Date;
  completion_date?: Date;
  status: EnrollmentStatus;
  grade?: string;
  created_at: Date;
  updated_at: Date;
}

export enum EnrollmentStatus {
  ENROLLED = 'enrolled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DROPPED = 'dropped',
  FAILED = 'failed'
}

// Request/Response DTOs
export interface CreateStudentDTO {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  enrollment_date?: string;
}

export interface UpdateStudentDTO {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: StudentStatus;
}

export interface CreateCourseDTO {
  course_code: string;
  course_name: string;
  description?: string;
  credits: number;
  duration_hours: number;
  instructor_id?: number;
  category: string;
  prerequisites?: string;
}

export interface UpdateCourseDTO {
  course_name?: string;
  description?: string;
  credits?: number;
  duration_hours?: number;
  instructor_id?: number;
  category?: string;
  prerequisites?: string;
  is_active?: boolean;
}

export interface IssueCertificateDTO {
  student_id: number;
  course_id: number;
  completion_date: string;
  grade?: string;
  gpa?: number;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Validation schemas
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationError[];
  timestamp: string;
}

// Certificate verification
export interface CertificateVerificationResult {
  valid: boolean;
  certificate?: {
    csl_number: string;
    student_name: string;
    course_name: string;
    issue_date: string;
    completion_date: string;
    status: CertificateStatus;
    grade?: string;
  };
  message: string;
  verified_at: string;
}

// Search and filtering
export interface StudentSearchFilter {
  search?: string;
  status?: StudentStatus;
  enrollment_year?: number;
  graduation_year?: number;
}

export interface CourseSearchFilter {
  search?: string;
  category?: string;
  is_active?: boolean;
  instructor_id?: number;
}

export interface CertificateSearchFilter {
  search?: string;
  status?: CertificateStatus;
  student_id?: number;
  course_id?: number;
  issue_date_from?: string;
  issue_date_to?: string;
}
