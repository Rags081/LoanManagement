# 🏛️ System Architecture

The **Loan Management System** is built on an enterprise architecture prioritizing mathematical accuracy, strict security, role-based access control, and low-latency serverless operations.

---

## 📐 High-Level Architecture Diagram

```
┌────────────────────────────────────────────────────────┐
│                   React 18 SPA (Vite)                  │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Pages & UI  │  │ Auth Context │  │  React Query │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │          │
│         └─────────────────┼─────────────────┘          │
│                           ▼                            │
│                 Axios API Client (@/api)               │
│               + Bearer JWT Interceptor                 │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS /api/*
                            ▼
┌────────────────────────────────────────────────────────┐
│          Netlify Serverless Functions Layer            │
│                                                        │
│  ┌──────────────────┐  ┌────────────────────────────┐  │
│  │ Rate Limiter IP  │  │  JWT & Role Auth Middleware│  │
│  └────────┬─────────┘  └─────────────┬──────────────┘  │
│           │                          │                 │
│           └──────────────────────────┼─────────────────┘
│                                      ▼                 │
│                          Repositories Layer            │
│                   (User, Borrower, Loan, Payment,      │
│                     Capital, Settings, Audit)          │
└──────────────────────────────────────┬─────────────────┘
                                       │ SQL Connection Pool
                                       ▼
┌────────────────────────────────────────────────────────┐
│                  MySQL 8.0+ Database                   │
└────────────────────────────────────────────────────────┘
```

---

## 💎 Single Financial Source of Truth

```
                    ┌─────────────────────────────┐
                    │ loanRepository              │
                    │ calculateOutstanding()      │
                    │                             │
                    │ SINGLE FINANCIAL SOURCE     │
                    │ OF TRUTH                    │
                    └──────────────┬──────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
         Loan Details          Dashboard             Reports
              │                    │                    │
              └────────────────────┼────────────────────┘
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
   - Total expected interest and outstanding balances reported in Loan Details, Dashboard, and Reports always reconcile with 100% mathematical consistency.

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

---

## 💰 Precision Financial Engine

All monetary calculations use `Decimal.js` configured with **20-digit precision** and **`ROUND_HALF_UP`** bankers rounding to eliminate floating-point drift.
- **Database Level**: Stored as `DECIMAL(15,2)` for currency and `DECIMAL(10,4)` for interest rates.
- **Frontend & Backend**: Instantiated via `new Decimal(val)` before arithmetic operations (`add`, `subtract`, `multiply`, `divide`, `round`).
