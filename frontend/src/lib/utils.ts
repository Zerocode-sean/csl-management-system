import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatCSL(cslNumber: string): string {
  // Format CSL number with proper spacing: YYYY-CC-NNNN-VVVVVV
  if (cslNumber.length !== 17) return cslNumber
  
  return `${cslNumber.slice(0, 4)}-${cslNumber.slice(5, 7)}-${cslNumber.slice(8, 12)}-${cslNumber.slice(13, 19)}`
}

export function validateCSLFormat(cslNumber: string): boolean {
  const cslRegex = /^\d{4}-[A-Z]{2}-\d{4}-[A-Z0-9]{6}$/
  return cslRegex.test(cslNumber)
}

export function generateRandomId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
  } else {
    // Fallback for older browsers
    return new Promise((resolve, reject) => {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'absolute'
      textArea.style.opacity = '0'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        document.execCommand('copy')
        textArea.remove()
        resolve()
      } catch (err) {
        textArea.remove()
        reject(err)
      }
    })
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}

export function getStatusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return 'badge-success'
    case 'suspended':
      return 'badge-warning'
    case 'revoked':
      return 'badge-error'
    case 'pending':
      return 'badge-info'
    default:
      return 'badge-info'
  }
}

export function getRoleDisplayName(role: string): string {
  switch (role) {
    case 'super_admin':
      return 'Super Admin'
    case 'admin':
      return 'Administrator'
    case 'course_manager':
      return 'Course Manager'
    default:
      return role
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function generateCSLPreview(year: number, courseCode: string, sequential: number): string {
  const paddedSequential = sequential.toString().padStart(4, '0')
  return `${year}-${courseCode}-${paddedSequential}-XXXXXX`
}

// API utility functions
export function handleApiError(error: any): string {
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  if (error.message) {
    return error.message
  }
  return 'An unexpected error occurred'
}

export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, String(value))
    }
  })
  
  return searchParams.toString()
}
