# 🏦 Loan Management System

A high-precision, production-grade Loan Management and Capital Tracking platform built with React 18, TypeScript, Tailwind CSS, Vite, Decimal.js, and Netlify Functions with MySQL 8.0+.

---

## 📑 Documentation Index

- [Architecture Overview](file:///d:/Rohit/LoanManagement/docs/ARCHITECTURE.md)
- [User Guide](file:///d:/Rohit/LoanManagement/docs/USER_GUIDE.md)
- [Administrator Guide](file:///d:/Rohit/LoanManagement/docs/ADMIN_GUIDE.md)
- [API Documentation](file:///d:/Rohit/LoanManagement/docs/API.md)
- [Database Schema & Migrations](file:///d:/Rohit/LoanManagement/docs/DATABASE.md)
- [Deployment Guide](file:///d:/Rohit/LoanManagement/docs/DEPLOYMENT.md)
- [Technical Context & Principles](file:///d:/Rohit/LoanManagement/docs/CONTEXT.md)
- [Phases & Roadmap Tracker](file:///d:/Rohit/LoanManagement/docs/PHASES.md)
- [Error & Troubleshooting Guide](file:///d:/Rohit/LoanManagement/docs/error.md)
- [Error Incident Log](file:///d:/Rohit/LoanManagement/docs/error-log.md)

---

## 🚀 Quickstart

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MySQL**: 8.0+

### 2. Installation
```bash
# Clone & Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

### 3. Database Setup
```bash
# Run database migrations and insert seed data
npm run db:setup
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server with HMR |
| `npm run build` | Compiles optimized production bundle to `dist/` |
| `npm run type-check` | Runs TypeScript compiler checks without emitting |
| `npm run lint` | Runs ESLint validation |
| `npm run test` | Runs all Vitest unit and integration test suites |
| `npm run test:watch` | Runs Vitest in interactive watch mode |
| `npm run test:coverage` | Generates unit and integration code coverage reports |
| `npm run test:e2e` | Runs Playwright end-to-end tests |
| `npm run test:e2e:ui` | Opens Playwright interactive UI test runner |
| `npm run format` | Formats code with Prettier |
| `npm run migrate` | Executes pending SQL migrations in `database/migrations/` |
| `npm run seed` | Seeds default administrator and system settings |
| `npm run db:setup` | Runs migration + seed sequentially |
| `npm run functions:dev` | Runs Netlify serverless functions locally |

---

## 👤 Default Administrator Credentials

- **Email**: `admin@loanmanagement.com`
- **Password**: `Admin@123`
- **Role**: `admin`
