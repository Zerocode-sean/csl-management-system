# 🎓 CSL Management System# CSL Management System



> A comprehensive, modern web-based Certificate & Student Lifecycle Management System built with React, Node.js, and PostgreSQL.A comprehensive management system for certificates, students, and courses. Built with React, Node.js, and PostgreSQL.



[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)## 🚀 Quick Start

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

[![React](https://img.shields.io/badge/React-18.0-61dafb)](https://reactjs.org/)### Prerequisites

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)- Node.js >= 18.x

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)- Docker & Docker Compose

[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed)](https://www.docker.com/)- PostgreSQL 15+ (if running locally)

- npm or yarn

## 📋 Table of Contents

### Installation

- [Overview](#overview)

- [Features](#features)1. **Clone the repository:**

- [Tech Stack](#tech-stack)   ```bash

- [Getting Started](#getting-started)   git clone https://github.com/your-org/csl-management-system.git

- [Installation](#installation)   cd csl-management-system

- [Usage](#usage)   ```

- [Project Structure](#project-structure)

- [Contributing](#contributing)2. **Setup environment variables:**

- [License](#license)   - Copy `.env.example` to `.env` and update values as needed.



## 🌟 Overview3. **Start with Docker Compose:**

   ```bash

The **CSL Management System** is a full-stack enterprise application designed to streamline the management of students, courses, certificates, and administrative operations for educational institutions. Built with modern technologies and best practices, it provides a secure, scalable, and user-friendly platform for certificate lifecycle management.   docker-compose up --build

   ```

### Key Highlights   - Access frontend at `http://localhost:3001`

   - Access backend at `http://localhost:5001`

- 🔐 **Secure Authentication** - JWT-based authentication with role-based access control

- 📊 **Real-time Analytics** - Interactive dashboards with data visualization4. **Manual Local Development:**

- 🎫 **Certificate Management** - Generate, verify, and track certificates with unique CSL numbers   - Start PostgreSQL locally or with Docker

- 👥 **Student Management** - Complete student lifecycle management with course enrollments   - Start backend:

- 🔍 **Public Verification** - Public-facing certificate verification portal     ```bash

- 🌓 **Dark Mode** - Beautiful light/dark theme with system preference detection     cd backend

- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices     npm install

- 🐳 **Docker Support** - Easy deployment with Docker and Docker Compose     npm run dev

     ```

## ✨ Features   - Start frontend:

     ```bash

### For Administrators     cd frontend

     npm install

- **Dashboard Overview** - Real-time statistics, recent activities, and quick actions     npm run dev

- **Student Management** - Full CRUD operations with profile pictures and course enrollments     ```

- **Course Management** - Create and manage course catalog

- **Certificate Management** - Generate, track, and revoke certificates## 🗂️ Project Structure

- **Analytics & Reports** - Comprehensive insights with time-based filtering

- **Settings & Profile** - Account management and theme customization```

csl-management-system/

### For Public Users├── backend/      # Node.js/Express API

├── frontend/     # React application

- **Certificate Verification** - Verify certificate authenticity using CSL number├── database/     # Database schemas, migrations, and seeds

├── docker/       # Docker configurations

## 🛠️ Tech Stack├── docs/         # Documentation

└── shared/       # Shared utilities and types

### Frontend```

- React 18 + TypeScript

- Vite (Build tool)## 🧰 Tech Stack

- Tailwind CSS + Framer Motion- React 18+ (TypeScript, Vite, Tailwind CSS)

- Zustand (State management)- Node.js (Express, TypeScript)

- React Router v6- PostgreSQL

- React Hook Form + Yup- Docker, Docker Compose

- Axios + React Hot Toast- JWT, Winston, ESLint, Prettier



### Backend## 📝 Contributing

- Node.js 18+ + Express + TypeScriptPull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

- PostgreSQL 15

- JWT Authentication## 📄 License

- Bcrypt (Password hashing)MIT

- Helmet + CORS

---

### DevOps

- Docker + Docker ComposeFor more details, see the `backend/README.md` and `frontend/README.md` for service-specific instructions.

- Git

## 🚀 Getting Started

### Prerequisites

- Node.js (v18.0 or higher)
- PostgreSQL (v15 or higher)
- Docker & Docker Compose (optional)

### Quick Start with Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/csl-management-system.git
cd csl-management-system

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

### Manual Setup

```bash
# Install backend dependencies
cd backend
npm install

# Setup database
npm run setup-db

# Start backend
npm run dev

# In a new terminal, start frontend
cd frontend
npm install
npm run dev
```

**Default Admin Credentials:**
- Email: `admin@csl.com`
- Password: `Admin@123`

## 📁 Project Structure

```
csl-management-system/
├── backend/                 # Node.js + Express backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities
│   └── Dockerfile
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── stores/        # State management
│   └── Dockerfile
├── database/              # Database migrations & seeds
├── docker-compose.yml     # Docker orchestration
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 📞 Support

For support, open an issue on GitHub or contact the development team.

---

Made with ❤️ by the CSL Team
