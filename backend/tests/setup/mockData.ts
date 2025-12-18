/**
 * Mock data and fixtures for testing
 */

export const mockCourses = [
  {
    courseCode: 'WD101',
    courseName: 'Web Development Bootcamp',
    description: 'Full stack web development course',
    durationWeeks: 12,
  },
  {
    courseCode: 'DS101',
    courseName: 'Data Science Fundamentals',
    description: 'Introduction to data science and analytics',
    durationWeeks: 16,
  },
  {
    courseCode: 'ML101',
    courseName: 'Machine Learning Basics',
    description: 'Introduction to ML and AI',
    durationWeeks: 14,
  },
];

export const mockStudents = [
  {
    studentCustomId: 'STU001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@test.com',
    phone: '+1234567890',
  },
  {
    studentCustomId: 'STU002',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@test.com',
    phone: '+1234567891',
  },
  {
    studentCustomId: 'STU003',
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob.johnson@test.com',
    phone: '+1234567892',
  },
];

export const mockUsers = [
  {
    username: 'testadmin',
    email: 'admin@test.com',
    role: 'admin',
  },
  {
    username: 'testmanager',
    email: 'manager@test.com',
    role: 'course_manager',
  },
];

export const mockCertificateData = {
  studentId: 1,
  courseId: 1,
  issuedBy: 1,
  completionDate: '2024-12-01',
};

/**
 * Generate random student data
 */
export function generateRandomStudent() {
  const randomId = Math.floor(Math.random() * 10000);
  return {
    studentCustomId: `TEST${randomId}`,
    firstName: `Student${randomId}`,
    lastName: `Last${randomId}`,
    email: `student${randomId}@test.com`,
    phone: `+1234${randomId}`,
  };
}

/**
 * Generate random course data
 */
export function generateRandomCourse() {
  const randomId = Math.floor(Math.random() * 1000);
  return {
    courseCode: `TST${randomId}`,
    courseName: `Test Course ${randomId}`,
    description: `Test course description ${randomId}`,
    durationWeeks: 12,
  };
}
