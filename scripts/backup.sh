#!/usr/bin/env bash
# ==============================================================================
# Database Automated Backup Script
# ==============================================================================
set -euo pipefail

# Load environment variables if .env file exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-loan_management}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_backup_${TIMESTAMP}.sql.gz"

echo "======================================================"
echo " Starting Database Backup for: ${DB_NAME}"
echo " Host: ${DB_HOST}:${DB_PORT} | User: ${DB_USER}"
echo "======================================================"

mkdir -p "${BACKUP_DIR}"

# Check mysqldump binary
if ! command -v mysqldump &> /dev/null; then
  echo "Error: mysqldump utility is not installed or not in PATH." >&2
  exit 1
fi

# Run mysqldump with gzip compression
echo "==> Exporting and compressing database dump..."
if [ -n "${DB_PASSWORD}" ]; then
  MYSQL_PWD="${DB_PASSWORD}" mysqldump \
    -h "${DB_HOST}" \
    -P "${DB_PORT}" \
    -u "${DB_USER}" \
    --single-transaction \
    --quick \
    --routines \
    --triggers \
    "${DB_NAME}" | gzip > "${BACKUP_FILE}"
else
  mysqldump \
    -h "${DB_HOST}" \
    -P "${DB_PORT}" \
    -u "${DB_USER}" \
    --single-transaction \
    --quick \
    --routines \
    --triggers \
    "${DB_NAME}" | gzip > "${BACKUP_FILE}"
fi

echo "==> Backup successfully created: ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"

# Prune backups older than 30 days
echo "==> Pruning backups older than 30 days..."
find "${BACKUP_DIR}" -type f -name "${DB_NAME}_backup_*.sql.gz" -mtime +30 -exec rm {} \;

echo "======================================================"
echo " Database Backup Process Completed Successfully!"
echo "======================================================"
