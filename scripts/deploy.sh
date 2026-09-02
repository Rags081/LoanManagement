#!/usr/bin/env bash
# ==============================================================================
# Automated Production Deployment Script
# ==============================================================================
set -euo pipefail

echo "======================================================"
echo " Starting Loan Management System Deployment Pipeline"
echo "======================================================"

# 1. Check Node & NPM versions
echo "==> Verifying Node.js and NPM versions..."
node -v
npm -v

# 2. Run Type Checks & Lint
echo "==> Running static type checks and linting..."
npm run type-check
npm run lint

# 3. Execute Automated Tests
echo "==> Running Vitest unit & integration test suites..."
npm run test

# 4. Run Migrations & Seeds
echo "==> Running database migrations..."
npm run migrate

# 5. Build Production Bundle
echo "==> Compiling optimized production bundle..."
npm run build

# 6. Deploy to Netlify (if CLI available)
if command -v netlify &> /dev/null; then
  echo "==> Deploying functions and static assets to Netlify..."
  netlify deploy --prod --dir=dist --functions=netlify/functions
  echo "==> Production deployment succeeded!"
else
  echo "==> Netlify CLI not found. Build is ready in 'dist/' directory."
fi

echo "======================================================"
echo " Deployment Pipeline Completed Successfully!"
echo "======================================================"
