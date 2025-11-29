# CSL Management System

A comprehensive management system for certificates, students, and courses. Built with React, Node.js, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.x
- Docker & Docker Compose
- PostgreSQL 15+ (if running locally)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/csl-management-system.git
   cd csl-management-system
   ```

2. **Setup environment variables:**
   - Copy `.env.example` to `.env` and update values as needed.

3. **Start with Docker Compose:**
   ```bash
   docker-compose up --build
   ```
   - Access frontend at `http://localhost:3001`
   - Access backend at `http://localhost:5001`

4. **Manual Local Development:**
   - Start PostgreSQL locally or with Docker
   - Start backend:
     ```bash
     cd backend
     npm install
     npm run dev
     ```
   - Start frontend:
     ```bash
     cd frontend
     npm install
     npm run dev
     ```

## 🗂️ Project Structure

```
csl-management-system/
├── backend/      # Node.js/Express API
├── frontend/     # React application
├── database/     # Database schemas, migrations, and seeds
├── docker/       # Docker configurations
├── docs/         # Documentation
└── shared/       # Shared utilities and types
```

## 🧰 Tech Stack
- React 18+ (TypeScript, Vite, Tailwind CSS)
- Node.js (Express, TypeScript)
- PostgreSQL
- Docker, Docker Compose
- JWT, Winston, ESLint, Prettier

## 📝 Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## 📄 License
MIT

---

For more details, see the `backend/README.md` and `frontend/README.md` for service-specific instructions.
# CSL-MANAGEMNT-SYS
