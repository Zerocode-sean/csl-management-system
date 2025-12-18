# Contributing to CSL Management System

First off, thank you for considering contributing to CSL Management System! It's people like you that make this project better for everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** to demonstrate the steps
- **Describe the behavior you observed** and what you expected
- **Include screenshots** if applicable
- **Specify your environment** (OS, Node.js version, browser, etc.)

**Bug Report Template:**

```markdown
**Description:**
A clear description of the bug

**Steps to Reproduce:**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior:**
What you expected to happen

**Actual Behavior:**
What actually happened

**Environment:**
- OS: [e.g., Windows 10, macOS 12.0, Ubuntu 20.04]
- Node.js: [e.g., v18.16.0]
- Browser: [e.g., Chrome 119, Firefox 120]
- Docker: [e.g., 24.0.5]

**Screenshots:**
If applicable, add screenshots
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a step-by-step description** of the suggested enhancement
- **Provide specific examples** to demonstrate the enhancement
- **Describe the current behavior** and **explain the expected behavior**
- **Explain why this enhancement would be useful**

### Your First Code Contribution

Unsure where to begin? You can start by looking through these issues:

- `good-first-issue` - Issues that are good for newcomers
- `help-wanted` - Issues that need assistance

### Pull Requests

1. Fork the repository and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes
4. Make sure your code follows the coding standards
5. Write a clear commit message
6. Open a pull request!

## Development Setup

### Prerequisites

- Node.js 18.0 or higher
- PostgreSQL 15 or higher
- Docker and Docker Compose (optional)
- Git

### Setup Steps

1. **Fork and Clone**

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/csl-management-system.git
cd csl-management-system
```

2. **Install Dependencies**

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Environment Setup**

```bash
# Backend - Copy and configure .env
cd backend
cp .env.example .env
# Edit .env with your database credentials

# Frontend - Copy and configure .env
cd ../frontend
cp .env.example .env
```

4. **Database Setup**

```bash
# Start PostgreSQL (or use Docker)
docker-compose up -d csl-postgres-dev

# Run migrations
cd backend
npm run migrate

# Seed database (optional)
npm run seed
```

5. **Start Development Servers**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

6. **Access the Application**

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Default login: admin@csl.com / Admin@123

## Pull Request Process

1. **Create a Feature Branch**

```bash
git checkout -b feature/amazing-feature
# or
git checkout -b fix/bug-description
```

2. **Make Your Changes**

- Write clean, readable code
- Follow the coding standards
- Add tests if applicable
- Update documentation if needed

3. **Commit Your Changes**

```bash
git add .
git commit -m "feat: add amazing feature"
```

4. **Push to Your Fork**

```bash
git push origin feature/amazing-feature
```

5. **Open a Pull Request**

- Go to the original repository
- Click "New Pull Request"
- Select your fork and branch
- Fill in the PR template
- Submit the PR

### Pull Request Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update

## Testing
- [ ] I have tested this code locally
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] All tests pass locally

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] My code follows the code style of this project
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have updated the documentation accordingly
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
```

## Coding Standards

### TypeScript/JavaScript

- Use **TypeScript** for all new code
- Follow **ESLint** rules configured in the project
- Use **Prettier** for code formatting
- Use **meaningful variable names**
- Write **JSDoc comments** for functions and complex logic
- Avoid `any` type - use proper typing
- Use async/await instead of promises chains

**Example:**

```typescript
/**
 * Generates a unique CSL number for a certificate
 * @param studentId - The ID of the student
 * @param courseCode - The course code
 * @returns The generated CSL number
 */
async function generateCSLNumber(
  studentId: number,
  courseCode: string
): Promise<string> {
  // Implementation
}
```

### React Components

- Use **functional components** with hooks
- Use **TypeScript interfaces** for props
- Keep components **small and focused**
- Extract **reusable logic** into custom hooks
- Use **meaningful component names**

**Example:**

```typescript
interface StudentCardProps {
  student: Student;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const StudentCard: React.FC<StudentCardProps> = ({ 
  student, 
  onEdit, 
  onDelete 
}) => {
  // Component implementation
};
```

### CSS/Tailwind

- Use **Tailwind CSS** utility classes
- Follow **mobile-first** approach
- Use **dark mode** variants with `dark:`
- Keep styles **consistent** across components
- Use **CSS custom properties** for theme values

### Backend/API

- Use **RESTful** conventions
- Return consistent **JSON responses**
- Use proper **HTTP status codes**
- Add **input validation**
- Handle **errors gracefully**
- Use **async/await** for database operations

**API Response Format:**

```typescript
// Success
{
  success: true,
  data: { ... },
  message: "Operation successful"
}

// Error
{
  success: false,
  error: "Error message",
  details: { ... }
}
```

### Database

- Use **migrations** for schema changes
- Write **descriptive column names**
- Add **indexes** for frequently queried columns
- Use **foreign keys** for relationships
- Add **NOT NULL** constraints where appropriate

### Testing

- Write **unit tests** for utilities and services
- Write **integration tests** for API endpoints
- Use **meaningful test descriptions**
- Follow **AAA pattern** (Arrange, Act, Assert)
- Mock external dependencies

**Example:**

```typescript
describe('CertificateService', () => {
  describe('generateCertificate', () => {
    it('should generate a certificate with valid CSL number', async () => {
      // Arrange
      const studentId = 1;
      const courseId = 1;
      
      // Act
      const result = await certificateService.generate(studentId, courseId);
      
      // Assert
      expect(result.cslNumber).toMatch(/^\d{4}-[A-Z]{2}-\d{4}-[A-F0-9]{6}$/);
    });
  });
});
```

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Build system changes
- **ci**: CI/CD changes
- **chore**: Other changes (dependencies, configs, etc.)

### Examples

```bash
# Feature
feat(students): add bulk import functionality

# Bug fix
fix(auth): resolve JWT token expiration issue

# Documentation
docs(readme): update installation instructions

# Refactor
refactor(certificates): simplify CSL number generation logic

# Performance
perf(dashboard): optimize database queries for stats

# Breaking change
feat(api)!: change certificate endpoint response format

BREAKING CHANGE: Certificate API now returns nested data structure
```

### Best Practices

- Use **present tense** ("add feature" not "added feature")
- Use **imperative mood** ("move cursor to..." not "moves cursor to...")
- Limit the **first line to 72 characters**
- Reference **issues and PRs** in the footer
- Add **body** for complex changes

## Questions?

Feel free to open an issue with the `question` label, or reach out to the maintainers directly.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to CSL Management System! 🎉
