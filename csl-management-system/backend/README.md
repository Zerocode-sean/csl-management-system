# CSL Management System Backend

A comprehensive REST API for the CSL Management System built with Express.js, TypeScript, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ (local or Docker)
- npm or yarn

### Installation & Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Environment Configuration:**
   - Copy `.env.example` to `.env` and update values as needed.

3. **API Docs:**
   - Swagger/OpenAPI available at `/api-docs` when running.

## ✨ Features
- JWT authentication & role-based access
- CRUD for students, courses, certificates
- Audit logging & admin dashboard
- Public certificate verification

## 🗂️ Structure
```
backend/
├── src/
│   ├── config/
│   ├── database/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   └── utils/
├── logs/
├── uploads/
├── dist/
```

## 📝 Contributing
Pull requests are welcome! For major changes, open an issue first.

## 📄 License
MIT
