# 🚀 Deployment Guide

This guide describes how to deploy the **Loan Management System** frontend and serverless functions to Netlify with CI/CD automation and link to a production MySQL database.

---

## 🌐 Netlify Deployment Steps

### 1. Build Settings
In your Netlify Dashboard or `netlify.toml`:
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Functions Directory**: `netlify/functions`

### 2. Environment Variables Configuration
Configure the following environment variables in the Netlify site settings (`Site configuration > Environment variables`):

```env
# Database Credentials
DB_HOST=your-production-db-host.com
DB_PORT=3306
DB_NAME=loan_management
DB_USER=production_user
DB_PASSWORD=strong_production_password
DB_POOL_MIN=2
DB_POOL_MAX=10

# Security & Authentication
JWT_SECRET=super_secret_production_key_random_64_chars_minimum
JWT_EXPIRY=24h
JWT_RESET_EXPIRY=1h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# Public Frontend Variables
VITE_API_URL=/api
VITE_APP_NAME="Loan Management System"

# Monitoring (Optional)
SENTRY_DSN=
```

---

## 🔄 Automated CI/CD Deployment

### GitHub Actions Workflow
The project includes a production CI/CD workflow at `.github/workflows/deploy.yml` that automatically:
1. Provisions a clean MySQL 8.0 service container.
2. Runs TypeScript type checking (`npm run type-check`).
3. Runs ESLint static analysis (`npm run lint`).
4. Runs schema migrations and seeds (`npm run db:setup`).
5. Executes all Vitest unit and integration test suites (`npm run test`).
6. Builds optimized production chunks (`npm run build`).
7. Deploys preview builds on PRs and production releases on `main`.

### Automated Deployment Script
You can also trigger a manual deployment using `scripts/deploy.sh`:
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

---

## 🗄️ Database Backup & Retention

Run the automated backup script:
```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```
This performs a compressed `mysqldump` and prunes archives older than 30 days.
