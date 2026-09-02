# 🚀 Deployment Guide

This guide describes how to deploy the **Loan Management System** frontend and serverless functions to Netlify with CI/CD automation, using either MySQL 8.0+ or MongoDB 6.0+ (MongoDB Atlas).

---

## 🌐 Netlify Deployment Steps

### 1. Build Settings
In your Netlify Dashboard or `netlify.toml`:
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Functions Directory**: `netlify/functions`

### 2. Environment Variables Configuration

Set `DB_DRIVER` to choose your database backend:

#### Option A: MongoDB Atlas (Recommended for cloud scalability)
```env
DB_DRIVER=mongodb
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=loan_management
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=2

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
```

#### Option B: MySQL 8.0+
```env
DB_DRIVER=mysql
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

---

## 📦 Data Migration from MySQL to MongoDB

When migrating an existing MySQL deployment to MongoDB:

1. **Perform Dry-Run Pre-flight Inspection**:
   ```bash
   npx tsx scripts/migrate-mysql-to-mongodb.ts --dry-run
   ```
2. **Execute Schema & Data Transfer**:
   ```bash
   npx tsx scripts/migrate-mysql-to-mongodb.ts --reset
   ```
3. **Run Dual Validation & Financial Reconciliation**:
   ```bash
   npx tsx scripts/validate-mysql-mongodb.ts
   ```
4. **Switch Driver**:
   Set `DB_DRIVER=mongodb` in your production environment settings and restart the deployment.
