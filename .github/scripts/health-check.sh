#!/usr/bin/env bash
set -euo pipefail
PORT="${1:?port required}"
HEALTH_PATH="${2:-/api/v1/vulcan/health-check}"
RETRIES="${3:-15}"
INTERVAL="${4:-10}"

echo "[health] http://127.0.0.1:${PORT}${HEALTH_PATH} — ${RETRIES}x every ${INTERVAL}s"
for i in $(seq 1 "$RETRIES"); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "http://127.0.0.1:${PORT}${HEALTH_PATH}" || true)
  if [[ "$STATUS" == "200" ]]; then
    echo "[health] Passed on attempt ${i}"
    exit 0
  fi
  echo "[health] Attempt ${i}/${RETRIES} — got ${STATUS}, retrying in ${INTERVAL}s..."
  sleep "$INTERVAL"
done

echo "ERROR: health check failed after $((RETRIES * INTERVAL))s" >&2
exit 1