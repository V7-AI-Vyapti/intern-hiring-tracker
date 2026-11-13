#!/usr/bin/env bash
# Usage: switch-traffic.sh <project-slug> [target-port]
#
# If target-port is omitted, detects the published host port of
# ${slug}-platform-green (Nest promote path).
#
# What it does:
#   1. Updates Nginx to proxy traffic to the target port
#   2. Reloads Nginx
#   3. Stops/removes old blue containers
#   4. Renames green containers to blue
set -euo pipefail

SLUG="${1:?slug required}"
TARGET_PORT="${2:-}"

DOMAIN="${SLUG}.v7ai.org"
CONF="/etc/nginx/sites-available/${DOMAIN}"
PLATFORM_BLUE="${SLUG}-platform-blue"
WORKER_BLUE="${SLUG}-background-worker-blue"
PLATFORM_GREEN="${SLUG}-platform-green"
WORKER_GREEN="${SLUG}-background-worker-green"

if [ -z "$TARGET_PORT" ]; then
  MAPPED="$(docker port "$PLATFORM_GREEN" 3000 2>/dev/null | head -n1 || true)"
  TARGET_PORT="${MAPPED##*:}"
  if [ -z "$TARGET_PORT" ] || [ "$TARGET_PORT" = "$MAPPED" ]; then
    echo "ERROR: could not detect green port for ${PLATFORM_GREEN}; pass target-port explicitly" >&2
    exit 1
  fi
  echo "[switch-traffic] Auto-detected green port ${TARGET_PORT}" >&2
fi

echo "[switch-traffic] Switching live traffic for ${DOMAIN} → 127.0.0.1:${TARGET_PORT}..." >&2

sudo tee "$CONF" > /dev/null << NGINX
server {
    listen 443 ssl http2;
    server_name ${DOMAIN};
    ssl_certificate     /etc/letsencrypt/live/v7ai.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/v7ai.org/privkey.pem;
    location / {
        proxy_pass         http://127.0.0.1:${TARGET_PORT};
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

echo "[switch-traffic] Traffic successfully routed to 127.0.0.1:${TARGET_PORT}" >&2

echo "[switch-traffic] Stopping and removing old blue containers..." >&2
docker rm -f "$PLATFORM_BLUE" "$WORKER_BLUE" 2>/dev/null || true

if docker inspect "$PLATFORM_GREEN" >/dev/null 2>&1; then
  echo "[switch-traffic] Renaming green containers to blue..." >&2
  docker rm -f "$PLATFORM_BLUE" 2>/dev/null || true
  docker rename "$PLATFORM_GREEN" "$PLATFORM_BLUE" 2>/dev/null || true
fi
if docker inspect "$WORKER_GREEN" >/dev/null 2>&1; then
  docker rm -f "$WORKER_BLUE" 2>/dev/null || true
  docker rename "$WORKER_GREEN" "$WORKER_BLUE" 2>/dev/null || true
fi

echo "[switch-traffic] Pruning old Docker images..." >&2
docker image prune -af >/dev/null 2>&1 || true

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
echo "  Traffic Switch & Cleanup Complete!" >&2
echo "  Domain         : https://${DOMAIN}" >&2
echo "  Active Port    : 127.0.0.1:${TARGET_PORT}" >&2
echo "  Blue Containers: Updated to active version" >&2
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
