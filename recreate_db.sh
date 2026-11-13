#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./recreate_db.sh [latest|all|<migration-file.ts>] [NewMigrationName]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${SCRIPT_DIR}"
cd "${APP_DIR}"

DB_DATABASE="${DB_DATABASE:-./tmp/dev.sqlite}"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-./src/core/database/migrations}"
DELETE_MODE="${1:-latest}"
NEW_MIGRATION_NAME="${2:-Auto$(date +%Y%m%d%H%M%S)}"
MIGRATE_SCRIPT="${APP_DIR}/migrate.sh"

if [[ ! -f "${MIGRATE_SCRIPT}" ]]; then
  echo "migrate.sh not found at: ${MIGRATE_SCRIPT}"
  exit 1
fi

echo "Resetting sqlite db: ${DB_DATABASE}"
rm -f "${DB_DATABASE}" "${DB_DATABASE}-wal" "${DB_DATABASE}-shm"

echo "Deleting migration(s) from: ${MIGRATIONS_DIR}"
if [[ "${DELETE_MODE}" == "all" ]]; then
  rm -f "${MIGRATIONS_DIR}"/*.ts
elif [[ "${DELETE_MODE}" == "latest" ]]; then
  LATEST_FILE="$(ls -1 "${MIGRATIONS_DIR}"/*.ts 2>/dev/null | sort | tail -n 1 || true)"
  if [[ -n "${LATEST_FILE}" ]]; then
    rm -f "${LATEST_FILE}"
    echo "Deleted latest migration: ${LATEST_FILE}"
  else
    echo "No migration file found to delete."
  fi
else
  TARGET_FILE="${MIGRATIONS_DIR}/${DELETE_MODE}"
  if [[ -f "${TARGET_FILE}" ]]; then
    rm -f "${TARGET_FILE}"
    echo "Deleted migration: ${TARGET_FILE}"
  else
    echo "Migration file not found: ${TARGET_FILE}"
    exit 1
  fi
fi

echo "Generating + running migration: ${NEW_MIGRATION_NAME}"
DB_TYPE=sqlite DB_DATABASE="${DB_DATABASE}" "${MIGRATE_SCRIPT}" "${NEW_MIGRATION_NAME}"

echo "Done."