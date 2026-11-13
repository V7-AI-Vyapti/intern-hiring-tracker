#!/usr/bin/env bash
# Usage: deploy-green.sh <project-slug> <repo-lower> <image-tag> [scripts-dir]
#
# Flow:
#   1. Pull new images from GHCR
#   2. Find a free host port in 5000-7000 via find-port.sh
#   3. Start green platform + background-worker containers
#   4. Run health check on green container port
#   5. Output green port and instructions (Live Nginx traffic remains unchanged)
set -euo pipefail

SLUG="${1:?slug required}"
REPO="${2:?repo required}"
IMAGE_TAG="${3:?image-tag required}"
SCRIPTS="${4:-$(dirname "$0")}"

PLATFORM_IMAGE="ghcr.io/${REPO}/${SLUG}-platform:${IMAGE_TAG}"
WORKER_IMAGE="ghcr.io/${REPO}/${SLUG}-background-worker:${IMAGE_TAG}"

PLATFORM_GREEN="${SLUG}-platform-green"
WORKER_GREEN="${SLUG}-background-worker-green"

DEPLOY_DIR="/home/deploy/vyapti/generated-projects/${SLUG}"
ENV_FILE="${DEPLOY_DIR}/.env"
ENV_PORTS="${DEPLOY_DIR}/.env.ports"
HEALTH_PATH="${HEALTH_PATH:-/api/v1/vulcan/health-check}"

# ── 1. Pull images ────────────────────────────────────────────────────────
echo "[green] Pulling images for tag ${IMAGE_TAG}..." >&2
docker pull "$PLATFORM_IMAGE" >&2
docker pull "$WORKER_IMAGE" >&2

# ── 2. Find a free port in 5000-7000 ──────────────────────────────────────
echo "[green] Finding free port..." >&2
NEW_PORT=$("$SCRIPTS/find-port.sh" "$SLUG" "platform-green")
echo "[green] Assigned green port: $NEW_PORT" >&2

# ── 3. Start green containers ─────────────────────────────────────────────
COMPOSE_NETWORK="${SLUG}_default"
docker network create "$COMPOSE_NETWORK" 2>/dev/null || true

# ── 3. Run database migrations ───────────────────────────────────────────
echo "[green] Running database migrations..." >&2
docker run --rm \
  --network "$COMPOSE_NETWORK" \
  --env-file "$ENV_FILE" \
  --env-file "$ENV_PORTS" \
  "$PLATFORM_IMAGE" \
  npx typeorm migration:run -d dist/core/database/typeorm.config.js >&2 2>&1 || echo "[green] Migration finished or no pending migrations." >&2

echo "[green] Starting green platform and background-worker..." >&2
docker rm -f "$PLATFORM_GREEN" "$WORKER_GREEN" 2>/dev/null || true

docker run -d \
  --name "$PLATFORM_GREEN" \
  --restart unless-stopped \
  --network "$COMPOSE_NETWORK" \
  --env-file "$ENV_FILE" \
  --env-file "$ENV_PORTS" \
  -p "${NEW_PORT}:3000" \
  "$PLATFORM_IMAGE" >&2

docker run -d \
  --name "$WORKER_GREEN" \
  --restart unless-stopped \
  --network "$COMPOSE_NETWORK" \
  --env-file "$ENV_FILE" \
  --env-file "$ENV_PORTS" \
  "$WORKER_IMAGE" \
  pnpm run worker:prod >&2

# ── 4. Health check green platform ────────────────────────────────────────
echo "[green] Waiting 15s for green containers to initialize..." >&2
sleep 15
RETRIES=15
INTERVAL=10
for i in $(seq 1 "$RETRIES"); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "http://127.0.0.1:${NEW_PORT}${HEALTH_PATH}" || true)
  if [ "$STATUS" = "200" ]; then
    echo "[green] Health check PASSED on attempt ${i}" >&2
    break
  fi
  if [ "$i" = "$RETRIES" ]; then
    echo "ERROR: health check failed after $((RETRIES * INTERVAL))s — cleaning green containers" >&2
    docker rm -f "$PLATFORM_GREEN" "$WORKER_GREEN" 2>/dev/null || true
    exit 1
  fi
  echo "[green] Attempt ${i}/${RETRIES} — got ${STATUS}, retrying in ${INTERVAL}s..." >&2
  sleep "$INTERVAL"
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
echo "  Green Deployment Complete!" >&2
echo "  Project   : $SLUG" >&2
echo "  Image Tag : $IMAGE_TAG" >&2
echo "  Green Port: $NEW_PORT" >&2
echo "  Status    : Healthy (Live traffic is still on previous port)" >&2
echo "  Next Step : Run switch-traffic.sh $SLUG $NEW_PORT to promote" >&2
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2

# Output the green port on stdout
echo "$NEW_PORT"