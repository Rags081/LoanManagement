# 🛠️ Administrator Guide - Loan Management System

This guide is intended for system administrators and DevOps engineers responsible for maintaining, monitoring, backing up, migrating, and configuring the Loan Management System.

---

## 1. System Architecture Overview

```
 ┌──────────────────────┐         ┌────────────────────────┐
 │   React 18 + Vite    │ ──────> │   Netlify Functions    │
 │ (Tailwind, Lucide)   │  HTTP   │  (TypeScript, Node 20) │
 └──────────────────────┘         └───────────┬────────────┘
                                              │ Dynamic Repositories
                                              ▼
                                 ┌───────────────────────────┐
                                 │   Database Abstraction    │
                                 │    (DB_DRIVER Switch)     │
                                 └─────────────┬─────────────┘
                                               │
                        ┌──────────────────────┴──────────────────────┐
                        ▼                                             ▼
            ┌────────────────────────┐                   ┌────────────────────────┐
            │   MySQL 8.0 Database   │                   │  MongoDB 6.0+ / Atlas  │
            │  (ACID Transactions)   │                   │ (Document Persistence) │
            └────────────────────────┘                   └────────────────────────┘
```

---

## 2. Database Administration & Driver Selection

### Driver Selection (`DB_DRIVER`)
The system supports two enterprise database engines, controlled transparently via environment variables:

| Setting | Description |
| :--- | :--- |
| `DB_DRIVER=mysql` | Uses MySQL 8.0+ connection pool via `mysql2/promise` (Default) |
| `DB_DRIVER=mongodb` | Uses MongoDB 6.0+ / MongoDB Atlas client via official `mongodb` driver |

### MySQL Connection Pool Configuration
- `DB_HOST`: Database server hostname
- `DB_PORT`: Database port (Default: 3306)
- `DB_NAME`: Database name (e.g., `loan_management`)
- `DB_USER`: Database username
- `DB_PASSWORD`: Database user password
- `DB_POOL_MIN`: Minimum idle connections (Default: 2)
- `DB_POOL_MAX`: Maximum active connections (Default: 10)

### MongoDB Configuration
- `MONGODB_URI`: MongoDB connection string (`mongodb://localhost:27017` or Atlas `mongodb+srv://...`)
- `MONGODB_DATABASE`: Target MongoDB database name (Default: `loan_management`)
- `MONGODB_MAX_POOL_SIZE`: Maximum pool connections (Default: 10)
- `MONGODB_MIN_POOL_SIZE`: Minimum pool connections (Default: 2)

---

## 3. Database Migration & Reconciliation

### Schema & Data Migration (MySQL → MongoDB)
The application includes a verified, non-destructive migration utility at `scripts/migrate-mysql-to-mongodb.ts`.

#### 1. Pre-flight Dry Run (Inspection only, 0 writes):
```bash
npx tsx scripts/migrate-mysql-to-mongodb.ts --dry-run
```
*Validates source tables, counts, relationships, and foreign key integrity without making any modifications.*

#### 2. Execute Full Schema & Data Migration:
```bash
npx tsx scripts/migrate-mysql-to-mongodb.ts --reset
```
*Safely drops target MongoDB collections, migrates all discovered tables (`users`, `borrowers`, `loans`, `payments`, `payment_allocations`, `capital_transactions`, `settings`, `audit_logs`), preserves exact numeric IDs and business codes, and ensures all indexes.*

#### 3. Dual Validation & Financial Reconciliation:
```bash
npx tsx scripts/validate-mysql-mongodb.ts
```
*Compares record counts, loan-by-loan balances, portfolio totals, and dashboard statistics across both engines to ensure 100% mathematical reconciliation.*

---

## 4. Monitoring & Health Diagnostics

### Health Check Endpoint
The system exposes a sanitized health-check endpoint at `/api/health`:

**Request**:
```http
GET /api/health
```

**Response (200 OK - MongoDB)**:
```json
{
  "status": "ok",
  "driver": "mongodb",
  "database": "connected",
  "uptime": 86400,
  "timestamp": "2026-09-02T18:00:00.000Z"
}
```

**Response (200 OK - MySQL)**:
```json
{
  "status": "ok",
  "driver": "mysql",
  "database": "connected",
  "uptime": 86400,
  "timestamp": "2026-09-02T18:00:00.000Z"
}
```

*Note: For security reasons, the endpoint does not expose database credentials, connection strings, internal stack traces, or infrastructure details.*

---

## 5. Security Hardening & Best Practices

1. **Strict Content-Security-Policy (CSP)**:
   - Configured in `netlify.toml` with frame restriction (`frame-ancestors 'none'`) and origin isolation.
2. **HTTP Security Headers**:
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
3. **Password Security**:
   - Bcrypt hashing with 10–12 salt rounds.
4. **JWT Expiration**:
   - Access tokens expire in 24 hours (`JWT_EXPIRY=24h`).
5. **Rate Limiting**:
   - In-memory sliding window rate limiter protects endpoints against brute-force attacks (5 failed auth attempts / 15 mins).
