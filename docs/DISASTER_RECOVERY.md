# 🛡️ Disaster Recovery & Business Continuity Guide

This document defines disaster recovery (DR) protocols, recovery time objectives (RTO), recovery point objectives (RPO), and step-by-step restoration workflows for the **Loan Management System**.

---

## 1. Objectives & Metrics

| Metric | Target | Description |
| :--- | :--- | :--- |
| **Recovery Point Objective (RPO)** | $< 1\text{ hour}$ | Maximum acceptable data loss window during catastrophic failure |
| **Recovery Time Objective (RTO)** | $< 5\text{ minutes}$ | Maximum acceptable downtime to restore operations via driver toggle or snapshot |

---

## 2. Dual-Engine Failover & Rollback Strategy

The application features a dual-database architecture allowing instant zero-downtime switching between database engines via the `DB_DRIVER` environment variable.

```
+-------------------------------------------------------------+
|               PRIMARY PRODUCTION ENGINE: MONGODB            |
|                  DB_DRIVER=mongodb (Active)                 |
+-------------------------------------------------------------+
                               |
                   [ Atlas Critical Outage ]
                               |
                               v
+-------------------------------------------------------------+
|               FAILOVER RECOVERY ENGINE: MYSQL               |
|                   DB_DRIVER=mysql (Instant)                 |
+-------------------------------------------------------------+
```

### Emergency Failover Procedure (RTO $< 2\text{ minutes}$):
1. Navigate to **Netlify Site Settings > Environment variables**.
2. Change `DB_DRIVER` from `mongodb` to `mysql`.
3. Save and trigger immediate redeployment.
4. Verify `/api/health` returns:
   ```json
   {
     "status": "ok",
     "driver": "mysql",
     "database": "connected"
   }
   ```

---

## 3. MongoDB Atlas Database Restoration Workflow

### Step 1: Pre-Flight Inspection (Dry Run)
Inspect the latest backup file or a specific snapshot without modifying the database:
```bash
npm run restore:mongodb -- --dry-run
```
Expected output:
```text
Source File : backups/mongodb_backup_20260902_194910.json
Dry Run     : YES (0 writes will be made)
Total Docs  : 192
  ✓ Collection `users                 `:    1 documents ready
  ✓ Collection `borrowers             `:    4 documents ready
  ✓ Collection `loans                 `:   10 documents ready
  ✓ Collection `payments              `:    7 documents ready
  ✓ Collection `payment_allocations   `:    9 documents ready
  ✓ Collection `capital_transactions  `:    3 documents ready
  ✓ Collection `settings              `:   25 documents ready
  ✓ Collection `audit_logs            `:  133 documents ready
```

### Step 2: Execute Live Restore
To restore from the latest snapshot in `backups/`:
```bash
npm run restore:mongodb
```

To restore from a specific snapshot:
```bash
npx tsx scripts/restore-mongodb.ts backups/mongodb_backup_20260902_194910.json
```

### Step 3: Post-Restoration Verification
1. Run reconciliation against MySQL:
   ```bash
   npm run validate:mongodb
   ```
2. Run smoke tests:
   ```bash
   npm run smoke-test
   ```

---

## 4. Re-Seeding / Restoring MySQL Reference Database

If the MySQL database needs to be restored:
1. Restore from SQL dump in `backups/`:
   ```bash
   mysql -u root -p loan_management < backups/loan_management_backup_20260902_182259.sql
   ```
2. Alternatively, re-run migrations and seeds:
   ```bash
   npm run db:setup
   ```
3. Synchronize MySQL to MongoDB:
   ```bash
   npm run migrate:mongodb -- --reset
   ```

---

## 5. Summary of Disaster Recovery Commands

| Action | Command |
| :--- | :--- |
| **Backup MongoDB** | `npm run backup:mongodb` |
| **Restore MongoDB (Dry Run)** | `npm run restore:mongodb -- --dry-run` |
| **Restore MongoDB (Live)** | `npm run restore:mongodb` |
| **Backup MySQL** | `npm run backup:mysql` |
| **Validate Database Consistency** | `npm run validate:mongodb` |
| **Full Smoke Test Suite** | `npm run smoke-test` |
