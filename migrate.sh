#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

MIGRATION_NAME="${1:-Auto$(date +%Y%m%d%H%M%S)}"

DB_TYPE="${DB_TYPE:-sqlite}"
DB_DATABASE="${DB_DATABASE:-./tmp/dev.sqlite}"

echo "Using migration name: ${MIGRATION_NAME}"
echo "DB_TYPE=${DB_TYPE}"
echo "DB_DATABASE=${DB_DATABASE}"

if [[ "${DB_TYPE}" == "sqlite" ]]; then
  mkdir -p "$(dirname "${DB_DATABASE}")"
fi

mkdir -p src/core/database/migrations

export TS_NODE_COMPILER_OPTIONS='{"module":"commonjs","moduleResolution":"node","esModuleInterop":true}'

TYPEORM_CLI="$(node -p "require.resolve('typeorm/cli-ts-node-commonjs.js')")"

run_typeorm() {
  DB_TYPE="${DB_TYPE}" DB_DATABASE="${DB_DATABASE}" \
  DB_HOST="${DB_HOST:-}" DB_PORT="${DB_PORT:-}" DB_USERNAME="${DB_USERNAME:-}" DB_PASSWORD="${DB_PASSWORD:-}" \
  node "$TYPEORM_CLI" "$@"
}

run_typeorm migration:generate "src/core/database/migrations/${MIGRATION_NAME}" \
  -d src/core/database/typeorm.config.ts

run_typeorm migration:run -d src/core/database/typeorm.config.ts

echo "Done."
