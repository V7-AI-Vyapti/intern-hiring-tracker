#!/usr/bin/env bash
# Usage: rollback.sh <project-slug> <repo-lower> <image-tag> [scripts-dir]
#
# What it does:
#   1. Deletes any existing green containers if present on the server
#   2. Pulls target Docker image for the given commit_sha / image_tag
#   3. Finds a free host port in 5000-7000 via find-port.sh
#   4. Runs the rollback image as green (${SLUG}-platform-green)
#   5. Runs health check on green container port
#   6. Shifts Nginx (SSL 443) traffic to the green container port
#   7. Stops and deletes the old blue container (${SLUG}-platform-blue)
#   8. Renames green container to blue (${SLUG}-platform-blue) and prunes old images
set -euo pipefail

SLUG="${1:?slug required}"
REPO="${2:?repo required}"
IMAGE_TAG="${3:?image-tag required}"
SCRIPTS="${4:-$(dirname "$0")}"

PLATFORM_IMAGE="ghcr.io/${REPO}/${SLUG}-platform:${IMAGE_TAG}"
WORKER_IMAGE="ghcr.io/${REPO}/${SLUG}-background-worker:${IMAGE_TAG}"

PLATFORM_BLUE="${SLUG}-platform-blue"
WORKER_BLUE="${SLUG}-background-worker-blue"
PLATFORM_GREEN="${SLUG}-platform-green"
WORKER_GREEN="${SLUG}-background-worker-green"

DEPLOY_DIR="/home/deploy/vyapti/generated-projects/${SLUG}"
ENV_FILE="${DEPLOY_DIR}/.env"
ENV_PORTS="${DEPLOY_DIR}/.env.ports"
HEALTH_PATH="${HEALTH_PATH:-/api/v1/vulcan/health-check}"

DOMAIN="${SLUG}.v7ai.org"
CONF="/etc/nginx/sites-available/${DOMAIN}"



# ── 2. Pull rollback images from GHCR ─────────────────────────────────────
echo "[rollback] Pulling rollback images for tag ${IMAGE_TAG}..." >&2
docker pull "$PLATFORM_IMAGE" >&2
docker pull "$WORKER_IMAGE" >&2

# ── 1. Delete green container if present ──────────────────────────────────
echo "[rollback] Cleaning up any existing green containers..." >&2
docker stop "$PLATFORM_GREEN" "$WORKER_GREEN" 2>/dev/null || true
docker rm   "$PLATFORM_GREEN" "$WORKER_GREEN" 2>/dev/null || true

# ── 3. Find a free port in 5000-7000 ──────────────────────────────────────
echo "[rollback] Finding free port..." >&2
NEW_PORT=$("$SCRIPTS/find-port.sh" "$SLUG" "platform-green")
echo "[rollback] Assigned rollback port: $NEW_PORT" >&2

# ── 4. Run rollback image as GREEN ────────────────────────────────────────
COMPOSE_NETWORK="${SLUG}_default"
docker network create "$COMPOSE_NETWORK" 2>/dev/null || true

echo "[rollback] Starting rollback container as GREEN..." >&2
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

# ── 5. Health check green platform ────────────────────────────────────────
echo "[rollback] Waiting 15s for green rollback containers to initialize..." >&2
sleep 15
RETRIES=15
INTERVAL=10
for i in $(seq 1 "$RETRIES"); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "http://127.0.0.1:${NEW_PORT}${HEALTH_PATH}" || true)
  if [ "$STATUS" = "200" ]; then
    echo "[rollback] Health check PASSED on attempt ${i}" >&2
    break
  fi
  if [ "$i" = "$RETRIES" ]; then
    echo "ERROR: rollback health check failed after $((RETRIES * INTERVAL))s — deleting green containers" >&2
    docker rm -f "$PLATFORM_GREEN" "$WORKER_GREEN" 2>/dev/null || true
    exit 1
  fi
  echo "[rollback] Attempt ${i}/${RETRIES} — got ${STATUS}, retrying in ${INTERVAL}s..." >&2
  sleep "$INTERVAL"
done

# ── 6. Shift Nginx (SSL 443) traffic to green port ───────────────────────
echo "[rollback] Switching live traffic for ${DOMAIN} → 127.0.0.1:${NEW_PORT}..." >&2

sudo tee "$CONF" > /dev/null << NGINX
server {
    listen 443 ssl http2;
    server_name ${DOMAIN};
    ssl_certificate     /etc/letsencrypt/live/v7ai.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/v7ai.org/privkey.pem;
    location / {
        proxy_pass         http://127.0.0.1:${NEW_PORT};
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_http_version 1.1;
        proxy_set_header   Connection        "";
        proxy_read_timeout 60s;
    }
}
NGINX

sudo ln -sf "$CONF" "/etc/nginx/sites-enabled/${DOMAIN}"

sudo nginx -t
sudo systemctl reload nginx

# ── 7. Stop & delete old BLUE container ───────────────────────────────────
echo "[rollback] Stopping and deleting old blue container..." >&2
docker rm -f "$PLATFORM_BLUE" "$WORKER_BLUE" 2>/dev/null || true

# ── 8. Rename GREEN container to BLUE ─────────────────────────────────────
echo "[rollback] Promoting green container to blue..." >&2
docker rm -f "$PLATFORM_BLUE" "$WORKER_BLUE" 2>/dev/null || true
docker rename "$PLATFORM_GREEN" "$PLATFORM_BLUE" 2>/dev/null || true
docker rename "$WORKER_GREEN"   "$WORKER_BLUE"   2>/dev/null || true

# Prune old Docker images
echo "[rollback] Pruning old Docker images..." >&2
docker image prune -af >/dev/null 2>&1 || true

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
echo "  Rollback & Promotion Complete!" >&2
echo "  Project    : $SLUG" >&2
echo "  Target Tag : $IMAGE_TAG" >&2
echo "  Domain     : https://${DOMAIN}" >&2
echo "  Active Port: 127.0.0.1:${NEW_PORT}" >&2
echo "  Status     : Live (Rolled back to blue successfully)" >&2
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2