# 🏛️ System Architecture

The **Loan Management System** is built on an enterprise architecture prioritizing mathematical accuracy, strict security, role-based access control, dual-database flexibility (MySQL 8.0+ and MongoDB 6.0+), and low-latency serverless operations.

---

## 📐 High-Level Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          React 18 SPA (Vite)                           │
│                                                                        │
│   ┌──────────────┐          ┌──────────────┐         ┌──────────────┐  │
│   │  Pages & UI  │          │ Auth Context │         │  React Query │  │
│   └──────┬───────┘          └──────┬───────┘         └──────┬───────┘  │
│          │                         │                        │          │
│          └─────────────────────────┼────────────────────────┘          │
│                                    ▼                                   │
│                        Axios API Client (@/api)                        │
│                        + Bearer JWT Interceptor                        │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ HTTPS /api/*
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Netlify Serverless Functions Layer                   │
│                                                                        │
│   ┌──────────────────┐               ┌──────────────────────────────┐  │
│   │ Rate Limiter IP  │               │ JWT & Role Auth Middleware   │  │
│   └────────┬─────────┘               └──────────────┬───────────────┘  │
│            │                                        │                  │
│            └────────────────────────────────────────┼──────────────────┘
│                                                     ▼                  │
│                         Repository Dispatcher Facade                   │
│                        (_lib/repositories/index.ts)                    │
│                                      │                                 │
│                  ┌───────────────────┴───────────────────┐             │
│                  ▼                                       ▼             │
│        MySQL Repositories                       MongoDB Repositories   │
│         (mysql2 connection pool)                 (official mongodb SDK)│
│                  │                                       │             │
│                  └───────────────────┬───────────────────┘             │
│                                      ▼                                 │
│                       Shared Pure Financial Engine                     │
│                       (_lib/financial-engine.ts)                       │
└──────────────────────────────────────┬─────────────────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
┌──────────────────────────────────────┐┌────────────────────────────────┐
│         MySQL 8.0+ Database          ││     MongoDB 6.0+ / Atlas       │
│      (Controlled by DB_DRIVER)       ││   (Controlled by DB_DRIVER)    │
└──────────────────────────────────────┘└────────────────────────────────┘
```

---

## 💎 Behavior-Preserving Pure Financial Engine

The financial calculation logic is encapsulated in `netlify/functions/_lib/financial-engine.ts`. Both MySQL repositories and MongoDB repositories share this identical calculation engine to guarantee 100% mathematical reconciliation across drivers.

```
                    ┌─────────────────────────────┐
                    │     financial-engine.ts     │
                    │  calculateLoanFinancials()  │
                    │                             │
                    │ SINGLE FINANCIAL SOURCE     │
                    │ OF TRUTH                    │
                    └──────────────┬──────────────┘
                                   │
               ┌───────────────────┼───────────────────┐
               ▼                   ▼                   ▼
        MySQL Repositories   Mongo Repositories   Unit Tests
               │                   │                   │
               └───────────────────┼───────────────────┘
                                   ▼
                         Same Financial Results
```

### Core Financial Rules
1. **Market-Style Monthly Interest**:
   - $\text{Monthly Interest} = \text{Active Principal} \times \text{Monthly Rate}$
   - $\text{Daily Interest} = \frac{\text{Monthly Interest}}{30}$
   - $\text{Partial Month Interest} = \text{Daily Interest} \times \text{Remaining Days}$
   - $\text{Period Interest} = (\text{Completed Months} \times \text{Monthly Interest}) + \text{Partial Month Interest}$
2. **Reducing Principal Balance**:
   - Repaid principal portions stop accruing interest immediately on their payment date.
3. **Reconciliation Guarantee**:
   - Total expected interest and outstanding balances reported in Loan Details, Dashboard, and Reports always reconcile with 100% mathematical consistency across MySQL and MongoDB.

---

## 🗄️ Database Abstraction & Dual Support

The system supports transparent database driver switching via the `DB_DRIVER` environment variable:

- `DB_DRIVER=mysql` (default): Uses the connection pool from `_lib/db/mysql.ts` and MySQL repositories.
- `DB_DRIVER=mongodb` or `mongo`: Uses the cached MongoClient from `_lib/db/mongodb.ts` and MongoDB repositories.

### Key Architecture Features:
1. **Repository Dispatcher Facade**: Transparently proxies method calls to the active database implementation without requiring changes to any Netlify function route.
2. **Preserved Numeric & Business IDs**: MongoDB documents store both sequential numeric integer IDs (`id`) and human-readable business codes (`borrower_id`, `loan_id`, `payment_id`, `transaction_id`), ensuring zero breaking changes to existing APIs.
3. **Schema-Driven Migration Utility**: `scripts/migrate-mysql-to-mongodb.ts` allows complete, verified transfer of all data from MySQL to MongoDB with `--dry-run` inspection and `--reset` overwrite capabilities.
4. **Automated Reconciliation**: `scripts/validate-mysql-mongodb.ts` validates record counts, loan-by-loan calculations, and portfolio baseline metrics across both engines.

---

## 🔒 Security Architecture

### 1. Authentication & JWT Token Flow
1. User submits credentials to `POST /api/auth/login`.
2. The endpoint checks IP rate limit (max 5 requests per 15 mins).
3. The server validates credentials against bcrypt hash (10-12 salt rounds).
4. If valid, an HMAC SHA-256 JWT is signed containing `{ id, email, role }` with a 24-hour expiry (`JWT_EXPIRY`).
5. Client stores token in `localStorage` and automatically attaches `Authorization: Bearer <token>` on all outgoing Axios requests.
6. The `ProtectedRoute` component ensures unauthenticated requests are redirected to `/login`, and unauthorized roles are blocked with a `403` to `/unauthorized`.

### 2. Role-Based Access Control (RBAC) Matrix

| Module / Route | Allowed Roles | Backend Policy |
| :--- | :--- | :--- |
| **Login / Forgot Password** | Public | Public |
| **Dashboard** (`/`) | `admin`, `operator`, `viewer` | `requireAuth` |
| **Borrowers** (`/borrowers`) | `admin`, `operator` | `requireRole(['admin', 'operator'])` |
| **Loans** (`/loans`) | `admin`, `operator` | `requireRole(['admin', 'operator'])` |
| **Payments** (`/payments`) | `admin`, `operator` | `requireRole(['admin', 'operator'])` |
| **Capital** (`/capital`) | `admin` | `requireAdmin` |
| **Reports** (`/reports`) | `admin`, `operator`, `viewer` | `requireAuth` |
| **Settings** (`/settings`) | `admin` | `requireAdmin` |
