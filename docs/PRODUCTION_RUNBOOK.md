# 🚀 Production Runbook — Loan Management System

This runbook outlines standard operating procedures, architectural guidelines, monitoring practices, and incident response protocols for the production deployment of the **Loan Management System**.

---

## 1. Production Architecture Overview

The system runs on a high-availability, serverless full-stack architecture:

```
                            Users / Web Browsers
                                     │
                                     ▼
                   Netlify Edge CDN (HTTPS / TLS 1.3)
                                     │
                   ┌─────────────────┴─────────────────┐
                   ▼                                   ▼
          Static React SPA                     Netlify Serverless
        (Vite Production Build)                 API Functions (/api/*)
                                                       │
                                                       ▼
                                            Repository Dispatcher
                                                       │
                                   ┌───────────────────┴───────────────────┐
                                   ▼                                       ▼
                       DB_DRIVER=mongodb (Active)                 DB_DRIVER=mysql (Rollback)
                                   │                                       │
                                   ▼                                       ▼
                          MongoDB Atlas Cluster                      MySQL Server
                          Database: ragscapital                  Database: loan_management
                                   │                                       │
                                   └───────────────────┬───────────────────┘
                                                       ▼
                                              financial-engine.ts
                                           (Single Source of Truth)
```

---

## 2. Environment Variables & Production Secrets

The following environment variables must be configured in Netlify (**Site settings > Environment variables**):

| Variable | Recommended Value | Purpose |
| :--- | :--- | :--- |
| `DB_DRIVER` | `mongodb` | Sets active database engine (`mongodb` or `mysql`) |
| `MONGODB_URI` | `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority` | Production MongoDB Atlas connection string |
| `MONGODB_DATABASE` | `ragscapital` | MongoDB Atlas target database name |
| `JWT_SECRET` | *(64-char random hex)* | Cryptographic key for signing admin authentication tokens |
| `NODE_ENV` | `production` | Enables production optimizations and disables debug traces |
| `DB_HOST` | *(MySQL host)* | Preserved for emergency rollback |
| `DB_USER` | *(MySQL user)* | Preserved for emergency rollback |
| `DB_PASSWORD` | *(MySQL password)* | Preserved for emergency rollback |
| `DB_NAME` | `loan_management` | Preserved for emergency rollback |
| `DB_PORT` | `3306` | Preserved for emergency rollback |

> [!SECURITY]
> Never commit connection strings or JWT secrets into Git. All secrets must be injected through Netlify environment variables or local `.env` files.

---

## 3. Pre-Flight Production Launch Checklist

Before opening the platform to end users:
1. **Netlify Custom Domain & HTTPS**:
   - Ensure custom DNS CNAME/A records point to Netlify.
   - Verify Let's Encrypt SSL/TLS certificate is active.
2. **MongoDB Atlas IP Whitelist**:
   - For Netlify Serverless functions, configure Network Access in Atlas:
     - `0.0.0.0/0` (Allow Access from Anywhere) with strong database user credentials and TLS-enforced connections.
3. **Database Health Check**:
   - Query `https://<production-domain>/api/health`
   - Ensure response is:
     ```json
     {
       "status": "ok",
       "driver": "mongodb",
       "database": "connected"
     }
     ```
4. **Admin Credentials Check**:
   - Verify login with initial admin account.
   - Update default passwords immediately following initial login.

---

## 4. Operational Monitoring & Health

### 4.1 Automated Health Endpoint
- **URL**: `GET /api/health`
- **Response Latency**: Expected $< 150\text{ms}$
- **Alert Trigger**: Any non-200 HTTP response or `"status": "error"` indicates database connectivity failure or driver misconfiguration.

### 4.2 MongoDB Atlas Metrics to Monitor
- **Connections**: Normal $< 20$ concurrent connections for serverless pools.
- **CPU Utilization**: Should remain $< 20\%$ under normal traffic.
- **Disk IOPS**: Monitor for unusual spikes during report generation.

---

## 5. Routine Maintenance & Backup Procedures

### 5.1 MongoDB Atlas Backups
Execute automated backup snapshots using the built-in CLI utility:
```bash
npm run backup:mongodb
```
Snapshots are saved to `backups/mongodb_backup_<timestamp>.json`.

### 5.2 MySQL Safety Snapshots (Rollback Source)
```bash
npm run backup:mysql
```
Snapshots are saved to `backups/loan_management_backup_<timestamp>.sql` and `.json`.

---

## 6. Incident Response & Troubleshooting

### Scenario A: `/api/health` reports `database: "disconnected"`
1. Check MongoDB Atlas cluster status (is cluster paused or rate-limited?).
2. Verify `MONGODB_URI` password and username are correct in Netlify environment variables.
3. If MongoDB Atlas has an unresolvable outage, execute **Emergency Database Rollback**:
   - Set `DB_DRIVER=mysql` in Netlify.
   - Trigger instant redeploy.

### Scenario B: Financial Discrepancy or Variance
1. Run dual-database validation tool:
   ```bash
   npm run validate:mongodb
   ```
2. Verify whether discrepancy is due to date tenure accrual (e.g., pro-rata daily interest across calendar boundary).
3. Both database engines use the identical `financial-engine.ts`, guaranteeing consistent reducing-balance math.
