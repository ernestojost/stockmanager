#!/bin/bash
# Deploys the live demo (https://stockmanager.reddevs.net) to the VPS over SSH.
# Run from the repo root in Git Bash:
#
#   bash ops/deploy.sh
#
# What it does:
#   1. builds the SPA locally with VITE_API_URL=/api (same origin, no CORS)
#   2. uploads the committed backend (git archive) + ops/ to /opt/stockmanager/api,
#      keeping the server's .env and node_modules, then npm ci --omit=dev
#   3. replaces /var/www/stockmanager.reddevs.net with the new build
#   4. restarts pm2 stockmanager-api and checks /api/health
#
# First-time server setup (database, .env, nginx vhost, certificate, cron)
# is documented in ops/README.md.
set -euo pipefail

HOST="${STOCKMANAGER_HOST:-root@185.215.167.136}"

cd "$(dirname "$0")/.."
if [ -n "$(git status --porcelain -- backend frontend ops)" ]; then
  echo "Uncommitted changes in backend/frontend/ops: commit them before deploying." >&2
  exit 1
fi

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

echo "==> Building the frontend"
(cd frontend && npm ci --no-audit --no-fund && VITE_API_URL=/api npm run build)
tar -C frontend/dist -czf "$WORK/web.tgz" .

echo "==> Packing the backend"
git archive --format=tar HEAD backend ops | gzip > "$WORK/api.tgz"

echo "==> Uploading to $HOST"
scp -q "$WORK/web.tgz" "$WORK/api.tgz" "$HOST:/tmp/"

ssh "$HOST" bash -s <<'REMOTE'
set -euo pipefail
APP=/opt/stockmanager/api
WEB=/var/www/stockmanager.reddevs.net

X=$(mktemp -d)
tar -xzf /tmp/api.tgz -C "$X"
mkdir -p "$APP"
find "$APP" -mindepth 1 -maxdepth 1 ! -name .env ! -name node_modules -exec rm -rf {} +
cp -a "$X/backend/." "$APP/"
cp -a "$X/ops" "$APP/ops"
chmod +x "$APP/ops/"*.sh
cd "$APP" && npm ci --omit=dev --no-audit --no-fund

mkdir -p "$WEB"
find "$WEB" -mindepth 1 -delete
tar -xzf /tmp/web.tgz -C "$WEB"
rm -rf "$X" /tmp/api.tgz /tmp/web.tgz

pm2 restart stockmanager-api --update-env 2>/dev/null \
  || pm2 start src/server.js --name stockmanager-api --cwd "$APP" --max-memory-restart 200M
pm2 save >/dev/null

for i in $(seq 1 15); do
  if curl -fsS http://127.0.0.1:4325/api/health; then echo; break; fi
  sleep 1
done
REMOTE

echo "Done: https://stockmanager.reddevs.net"
