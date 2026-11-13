#!/usr/bin/env bash
# Usage: find-port.sh <slug> <service> [exclude_ports...]
# Assigns an available host port in 5000-7000 by checking active host sockets.
set -euo pipefail

SLUG="${1:?slug required}"
SERVICE="${2:?service required}"
shift 2 2>/dev/null || true
EXCLUDES=("$@")

for PORT in $(seq 9000 11000); do
  # Check if port is in exclude list
  SKIP=0
  for EX in "${EXCLUDES[@]}"; do
    if [[ "$PORT" == "$EX" ]]; then
      SKIP=1
      break
    fi
  done
  if [[ "$SKIP" -eq 1 ]]; then continue; fi

  # Check if port is in use on host
  if ss -tlnp | grep -q ":${PORT} "; then continue; fi

  if [[ -n "$SLUG" && -n "$SERVICE" ]]; then
    echo "[port] ${SLUG}.${SERVICE} → $PORT" >&2
  fi
  echo "$PORT"
  exit 0
done

echo "ERROR: no free port found in 5000-7000" >&2
exit 1