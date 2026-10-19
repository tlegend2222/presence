#!/bin/sh
# Presence boot: ensure deps, then start the dev server on :8080 if not already up.
set -eu
cd /workspace/presence
LOG=/tmp/presence-startup.log
echo "[$(date)] startup" >>"$LOG"

# :8081 is QA-only — a revive must never inherit a stale built-output preview.
node scripts/preview.mjs stop >>"$LOG" 2>&1 || true

if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  echo "already running" >>"$LOG"; exit 0
fi

# Reinstall when node_modules is missing, vite binary is gone, or the lockfile changed.
STAMP=node_modules/.lock-hash
HASH=$(sha256sum package-lock.json | cut -d' ' -f1)
if [ ! -x node_modules/.bin/vite ] || [ ! -f "$STAMP" ] || [ "$(cat "$STAMP")" != "$HASH" ]; then
  echo "installing deps" >>"$LOG"
  npm ci --no-audit --no-fund >>"$LOG" 2>&1 || npm install --no-audit --no-fund >>"$LOG" 2>&1
  echo "$HASH" >"$STAMP"
fi

# Playwright browser for the test scripts (optional; don't fail boot).
[ -d "$HOME/.cache/ms-playwright" ] || npx playwright install chromium >>"$LOG" 2>&1 || true

nohup npm run dev >>"$LOG" 2>&1 &

# Wait up to 60s for the server to answer.
i=0
while [ $i -lt 30 ]; do
  curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/ && { echo "up" >>"$LOG"; exit 0; }
  i=$((i+1)); sleep 2
done
echo "server did not come up; see $LOG" >>"$LOG"; exit 1
