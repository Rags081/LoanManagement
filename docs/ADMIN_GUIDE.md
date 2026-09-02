# 🛠️ Administrator Guide - Loan Management System

This guide is intended for system administrators and DevOps engineers responsible for maintaining, monitoring, backing up, and configuring the Loan Management System.

---

## 1. System Architecture Overview

```
 ┌──────────────────────┐         ┌────────────────────────┐
 │   React 18 + Vite    │ ──────> │   Netlify Functions    │
 │ (Tailwind, Lucide)   │  HTTP   │  (TypeScript, Node 20) │
 └──────────────────────┘         └───────────┬────────────┘
                                              │ MySQL2 Pool
                                              ▼
                                  ┌────────────────────────┐
                                  │   MySQL 8.0 Database   │
                                  │   (ACID Transactions)  │
                                  └────────────────────────┘
```

---

## 2. Database Administration & Connection Pool

### Connection Pool Configuration
The backend uses `mysql2/promise` connection pooling configured in `netlify/functions/_lib/database.ts`:
- `DB_POOL_MIN`: Minimum idle connections (Default: 2)
- `DB_POOL_MAX`: Maximum active connections (Default: 10)
- `connectionLimit`: 10
- `waitForConnections`: true
- `queueLimit`: 0

### Running Migrations & Seeds
```bash
# Run schema migrations
npm run migrate

# Run initial seeds
npm run seed

# Run both in sequence
npm run db:setup
```

---

## 3. Database Backup & Disaster Recovery

### Automated Backup Script
Run the environment-aware backup script located at `scripts/backup.sh`:
```bash
# Execute backup
chmod +x scripts/backup.sh
./scripts/backup.sh
```

### Backup Mechanism:
1. Validates `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` from `.env`.
2. Uses `mysqldump --single-transaction --quick --routines --triggers`.
3. Compresses the output directly via `gzip` to `./backups/loan_management_backup_YYYYMMDD_HHMMSS.sql.gz`.
4. Automatically prunes backups older than 30 days.

### Database Restoration:
```bash
gunzip < backups/loan_management_backup_20260902_120000.sql.gz | mysql -u root -p -h localhost loan_management
```

---

## 4. Monitoring & Health Diagnostics

### Health Check Endpoint
The system exposes a sanitized health-check endpoint at `/api/health`:

**Request**:
```http
GET /api/health
```

**Response (200 OK)**:
```json
{
  "status": "ok",
  "database": "connected",
  "uptime": 86400,
  "timestamp": "2026-09-02T12:00:00.000Z"
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
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
   - `Referrer-Policy: strict-origin-when-cross-origin`
3. **Password Security**:
   - Hashed using bcrypt with 10-12 salt rounds.
4. **Token Security**:
   - JWT tokens signed with minimum 32-character random secret key and 24h expiration.

---

## 6. Troubleshooting & Diagnostics

| Issue | Potential Cause | Solution |
| :--- | :--- | :--- |
| `ER_ACCESS_DENIED_ERROR` | Incorrect DB credentials in `.env` | Verify `DB_USER` and `DB_PASSWORD` in `.env`. |
| `ECONNREFUSED` on port 3306 | MySQL server not running | Start MySQL service via `systemctl start mysql` or service manager. |
| `TokenExpiredError` | User session expired | Re-authenticate via `/login`. |
| Netlify Function Timeout | Slow database query | Check connection pool limits and index usage in MySQL slow query log. |
