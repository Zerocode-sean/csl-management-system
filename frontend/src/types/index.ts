// Common Types
export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

// User & Auth Types
export interface User {
  id: string
  username: string
  email: string
  role: 'super_admin' | 'admin' | 'course_manager'
  firstName: string
  lastName: string
  mobile?: string
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
}

// Student Types
export interface Student extends BaseEntity {
  name: string
  email: string
  mobile?: string
  address?: string
  dateOfBirth?: string
  deletedAt?: string
}

export interface CreateStudentRequest {
  name: string
  email: string
  mobile?: string
  address?: string
  dateOfBirth?: string
}

// Course Types
export interface Course extends BaseEntity {
  code: string
  title: string
  description?: string
  durationMonths?: number
  isActive: boolean
  deletedAt?: string
}

export interface CreateCourseRequest {
  code: string
  title: string
  description?: string
  durationMonths?: number
}

// Certificate Types
export interface Certificate {
  cslNumber: string
  studentId: string
  courseId: string
  issuedByAdminId: string
  issueDate: string
  status: 'active' | 'revoked' | 'suspended'
  revokedAt?: string
  revokedByAdminId?: string
  revocationReason?: string
  notes?: string
  createdAt: string
  updatedAt: string
  
  // Relations
  student?: Student
  course?: Course
  issuedBy?: User
  revokedBy?: User
}

export interface IssueCertificateRequest {
  studentId: string
  courseId: string
  notes?: string
}

export interface RevokeCertificateRequest {
  reason: string
}

export interface CertificateStatistics {
  total: number
  active: number
  revoked: number
  suspended: number
  byYear: Array<{
    year: number
    total: number
    active: number
    revoked: number
  }>
  byCourse: Array<{
    courseId: string
    courseCode: string
    courseTitle: string
    total: number
    active: number
    revoked: number
  }>
}

// Verification Types
export interface VerificationResult {
  valid: boolean
  certificate?: {
    cslNumber: string
    studentName: string
    courseTitle: string
    issueDate: string
    status: string
  }
  message?: string
}

// Audit Log Types
export interface AuditLog {
  id: string
  adminId?: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'REVOKE' | 'LOGIN' | 'LOGOUT'
  entityType: string
  entityId?: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  createdAt: string
  
  // Relations
  admin?: User
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  statusCode?: number
}

// Form Types
export interface FormFieldError {
  message: string
}

export interface FormErrors {
  [key: string]: FormFieldError | undefined
}

// Query Parameters
export interface BaseQueryParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface StudentQueryParams extends BaseQueryParams {
  // Add student-specific filters if needed
}

export interface CourseQueryParams extends BaseQueryParams {
  active?: boolean
}

export interface CertificateQueryParams extends BaseQueryParams {
  status?: string
  courseId?: string
  studentId?: string
  startDate?: string
  endDate?: string
}

export interface AdminQueryParams extends BaseQueryParams {
  role?: string
}

export interface AuditQueryParams extends BaseQueryParams {
  action?: string
  entityType?: string
  startDate?: string
  endDate?: string
}

// Component Props Types
export interface TableColumn<T> {
  key: keyof T | string
  title: string
  sortable?: boolean
  render?: (value: any, record: T) => React.ReactNode
  width?: string | number
}

export interface FilterOption {
  label: string
  value: string | number | boolean
}

export interface ActionMenuItem {
  key: string
  label: string
  icon?: React.ReactNode
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system'

// Navigation Types
export interface NavItem {
  key: string
  label: string
  path: string
  icon: React.ReactNode
  requiredRole?: User['role'][]
  children?: NavItem[]
}

// Dashboard Types
export interface DashboardStats {
  totalStudents: number
  totalCourses: number
  totalCertificates: number
  activeCertificates: number
  revokedCertificates: number
  recentVerifications: number
  
  // Growth data
  studentsGrowth: number
  certificatesGrowth: number
  verificationsGrowth: number
  
  // Charts data
  certificatesByMonth: Array<{
    month: string
    issued: number
    verified: number
  }>
  
  certificatesByStatus: Array<{
    status: string
    count: number
    percentage: number
  }>
  
  topCourses: Array<{
    courseTitle: string
    certificatesCount: number
  }>
}

// Settings Types
export interface SystemSettings {
  siteName: string
  siteUrl: string
  supportEmail: string
  certificateValidityYears: number
  verificationRateLimit: number
  backupRetentionDays: number
  sessionTimeoutMinutes: number
  
  // Email settings
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
  smtpSecure: boolean
  
  // Security settings
  passwordMinLength: number
  passwordRequireSpecialChars: boolean
  passwordRequireNumbers: boolean
  passwordRequireUppercase: boolean
  accountLockoutAttempts: number
  accountLockoutDuration: number
}
