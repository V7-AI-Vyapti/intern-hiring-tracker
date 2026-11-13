#!/usr/bin/env bash
# Usage: prepare-deploy.sh <project-slug> <deploy-dir> <repo-owner> <scripts-dir> <branch>
# What it does:
#   1. Clones repo if not present, else resets to latest <branch> (no merge/divergence)
#   2. Assigns a free external port for every host-exposed service via find-port.sh
#   3. Writes all PORT_* assignments to <deploy-dir>/.env.ports
#   4. Prints the platform port to stdout (captured by workflow for nginx + logging)
#
# Port env vars written (matches docker-compose.yml interpolation):
#   PORT_platform_3000   →  platform host port  (nginx proxies this)
#   PORT_minio_9000      →  minio API host port
#   PORT_minio_9001      →  minio console host port
set -euo pipefail
SLUG="${1:?slug required}"
DEPLOY_DIR="${2:?deploy-dir required}"
REPO_OWNER="${3:?repo-owner required}"
SCRIPTS="${4:?scripts-dir required}"
BRANCH="${5:?branch required}"

# ── Clone / reset (reset --hard avoids merge/divergence issues) ───────────
mkdir -p "$DEPLOY_DIR"
if [ ! -d "$DEPLOY_DIR/.git" ]; then
  echo "[git] Cloning ${SLUG}..." >&2
  git clone "https://github.com/${REPO_OWNER}/${SLUG}.git" "$DEPLOY_DIR" >&2
fi
cd "$DEPLOY_DIR"
git config --global --add safe.directory '*'
git fetch origin >&2
git checkout "$BRANCH" >&2
git reset --hard "origin/$BRANCH" >&2
if [ -f "$DEPLOY_DIR/.env.example" ] && [ ! -s "$DEPLOY_DIR/.env" ]; then
  cp "$DEPLOY_DIR/.env.example" "$DEPLOY_DIR/.env"
else
  touch "$DEPLOY_DIR/.env"
fi

write_env_line() {
  local name="$1"
  local value="$2"
  if [ -z "$value" ]; then
    return 0
  fi
  grep -v "^${name}=" "$DEPLOY_DIR/.env" > "$DEPLOY_DIR/.env.tmp" || true
  mv "$DEPLOY_DIR/.env.tmp" "$DEPLOY_DIR/.env"
  printf '%s=%s\n' "$name" "$value" >> "$DEPLOY_DIR/.env"
}

write_env_line APP_JWT_PRIVATE_KEY "${APP_JWT_PRIVATE_KEY:-}"
write_env_line APP_JWT_PUBLIC_KEY "${APP_JWT_PUBLIC_KEY:-}"
write_env_line APP_BOOTSTRAP_ADMIN_EMAIL "${APP_BOOTSTRAP_ADMIN_EMAIL:-}"
write_env_line APP_BOOTSTRAP_ADMIN_PASSWORD "${APP_BOOTSTRAP_ADMIN_PASSWORD:-}"

echo "[git] Up to date on branch: $BRANCH" >&2

# ── Assign free ports for all host-exposed services ───────────────────────
echo "[port] Assigning ports..." >&2

PORT_platform_3000=$("$SCRIPTS/find-port.sh" "$SLUG" "platform.3000")
PORT_minio_9000=$("$SCRIPTS/find-port.sh"    "$SLUG" "minio.9000" "$PORT_platform_3000")
PORT_minio_9001=$("$SCRIPTS/find-port.sh"    "$SLUG" "minio.9001" "$PORT_platform_3000" "$PORT_minio_9000")

# Write .env.ports — read by docker compose via --env-file flag
# This feeds compose-level interpolation (${PORT_*} in docker-compose.yml)
# It does NOT replace env_file: .env inside services — both are read
cat > "$DEPLOY_DIR/.env.ports" <<PORTS
PORT_platform_3000=${PORT_platform_3000}
PORT_minio_9000=${PORT_minio_9000}
PORT_minio_9001=${PORT_minio_9001}
PORTS

echo "[port] Assignments written to $DEPLOY_DIR/.env.ports:" >&2
cat "$DEPLOY_DIR/.env.ports" >&2

# Print platform port to stdout so the workflow can capture it
echo "$PORT_platform_3000"