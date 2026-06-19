#!/usr/bin/env bash
#
# Art Intelligence production deploy script.
#
#   frontend (nginx) :8080  ──/panasa/api──►  backend (node) :3000
#   Public entrypoint: http(s)://<host>:4770/panasa/
#
# Usage:
#   ./deploy.sh           # pull, build, (re)start the stack
#   ./deploy.sh --no-pull # skip git pull (deploy current checkout)
#
set -euo pipefail

cd "$(dirname "$0")"

PULL=1
for arg in "$@"; do
  case "$arg" in
    --no-pull) PULL=0 ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done

# docker compose v2 (plugin) preferred, fall back to legacy docker-compose.
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "❌ Docker Compose not found. Install Docker first." >&2
  exit 1
fi

# Secrets must exist (injected at runtime via env_file, never baked into the image).
if [ ! -f server/.env ]; then
  echo "❌ server/.env is missing. Create it with:" >&2
  echo "     LYZR_API_KEY=..." >&2
  echo "     LYZR_ALLOWED_AGENTS=<comma-separated agent ids>" >&2
  echo "   (copy server/.env.example to server/.env and fill it in)" >&2
  exit 1
fi

if [ "$PULL" -eq 1 ] && [ -d .git ]; then
  echo "▶ Pulling latest changes..."
  git pull --ff-only
fi

echo "▶ Building images..."
$COMPOSE build

echo "▶ Starting stack..."
$COMPOSE up -d

echo "▶ Waiting for the app to come up..."
ok=0
for i in $(seq 1 30); do
  code="$(curl -s -o /dev/null -w '%{http_code}' http://localhost:4770/art-intelligence/healthz || true)"
  if [ "$code" = "200" ]; then ok=1; break; fi
  sleep 2
done

echo
$COMPOSE ps
echo
if [ "$ok" -eq 1 ]; then
  echo "✅ Deploy complete."
  echo "   Direct (container):  http://localhost:4770/art-intelligence/  (health: 200)"
  echo "   Public (via TLS):    https://ai.arttechgroup.com:7777/art-intelligence/"
else
  echo "⚠️  Stack started but health check did not return 200 in time."
  echo "   Check logs:  $COMPOSE logs -f"
  exit 1
fi
