# Loan Management System

A high-precision, enterprise-ready Loan Management and Capital Tracking platform built with React 18, TypeScript, Vite, Tailwind CSS, Decimal.js, Netlify Functions, and MySQL 8.0+.

---

## 🚀 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router v6
- **State & Data**: TanStack Query (React Query) v5, React Hook Form, Zod
- **Calculations & Math**: Decimal.js (for high-precision financial arithmetic without floating-point error)
- **Utilities & UI**: date-fns, Recharts, ExcelJS, FileSaver, Lucide React, React Hot Toast
- **Backend / Serverless**: Netlify Functions (Node.js/TypeScript)
- **Database**: MySQL 8.0+ with connection pooling and ACID transactions
- **Testing**: Vitest (Unit & Integration), Playwright (E2E)

---

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MySQL**: 8.0+ (for database persistence)

---

## 🛠️ Installation & Setup

1. **Clone & Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```

3. **Run Database Migrations & Seeds**
   ```bash
   npm run db:setup
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing

```bash
# Run unit & integration tests
npm run test

# Run tests with live watch
npm run test:watch

# Generate coverage reports
npm run test:coverage

# Run Playwright E2E tests
npm run test:e2e
```

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite development server with HMR |
| `npm run build` | Compiles optimized, code-split production bundle to `dist/` |
| `npm run preview` | Previews the production build locally |
| `npm run type-check` | Runs TypeScript compiler checks without emitting files |
| `npm run lint` | Lints codebase using ESLint (0 errors, 0 warnings) |
| `npm run test` | Runs Vitest unit and integration test suite |
| `npm run test:coverage` | Generates test coverage report |
| `npm run test:e2e` | Runs Playwright end-to-end test suite |
| `npm run format` | Formats code using Prettier |
| `npm run migrate` | Executes pending SQL schema migrations |
| `npm run seed` | Seeds default administrator and system settings |
| `npm run db:setup` | Runs migration + seed sequentially |
| `npm run functions:dev` | Runs Netlify serverless functions locally |

---

## 📑 Documentation

- [User Guide](file:///d:/Rohit/LoanManagement/docs/USER_GUIDE.md) - Complete user workflows, loan disbursal, payment processing & FAQ
- [Administrator Guide](file:///d:/Rohit/LoanManagement/docs/ADMIN_GUIDE.md) - DB administration, backups, disaster recovery & diagnostics
- [Architecture & Financial Source of Truth](file:///d:/Rohit/LoanManagement/docs/ARCHITECTURE.md) - System architecture and calculation principles
- [API Documentation](file:///d:/Rohit/LoanManagement/docs/API.md) - Complete endpoints reference
- [Database Schema](file:///d:/Rohit/LoanManagement/docs/DATABASE.md) - Table schemas and relational models
- [Deployment & CI/CD](file:///d:/Rohit/LoanManagement/docs/DEPLOYMENT.md) - Netlify deployment and automated pipelines
- [Project Phases Tracker](file:///d:/Rohit/LoanManagement/docs/PHASES.md) - All roadmap phases marked complete

---

## 👤 Default Administrator Credentials

- **Email**: `admin@loanmanagement.com`
- **Password**: `Admin@123`
- **Role**: `admin`
