# Panasa Intelligence — Production Deployment

Two containers, wired by `docker-compose.yml`:

```
frontend (nginx) :8080  ──/panasa/api──►  backend (node) :3000
```

Public entrypoint: **`https://<host>:4770/panasa/`**

## Prerequisites
- Docker + Docker Compose
- `server/.env` populated with real values (gitignored, never baked into the image):
  ```
  LYZR_API_KEY=<rotated-lyzr-key>
  LYZR_ALLOWED_AGENTS=6a1dc89af6b085eee307e2f9,6a1874f7da56d8978dfe6d0b,...
  # optional overrides:
  # LYZR_BASE_URL=https://agent-prod.studio.lyzr.ai/v3/inference/chat/
  # LYZR_USER_ID=panasa-ops
  ```
  Copy the template and fill it in:
  ```bash
  cp server/.env.example server/.env
  ```

## Run
```bash
./deploy.sh               # pull, build, start, health-check (one shot)

# ...or the raw compose commands:
docker compose build      # build both images
docker compose up -d      # start detached
docker compose ps         # check status
docker compose logs -f    # tail logs
docker compose down       # stop & remove
```

## Smoke test
```bash
curl http://localhost:4770/panasa/healthz   # -> 200 {"ok":true}
curl -I http://localhost:4770/panasa/        # -> 200 (SPA)
curl -I http://localhost:4770/               # -> 302 /panasa/
```

## How the path prefix works
- The Angular app is built with `--base-href /panasa/` (see the frontend
  `Dockerfile`), so `<base href>` and all assets live under `/panasa/`.
- API calls use a **relative** URL — `environment.apiUrl = 'api/agent'`
  (`src/environments/environment.ts`) — which resolves against `<base href>`:
  `/panasa/api/agent` in the container, `/api/agent` during local dev.
- nginx (`nginx.conf`) serves the SPA at `/panasa/` and reverse-proxies
  `/panasa/api/*` → `backend:3000/api/*` (the `/panasa` prefix is stripped).
- The Node proxy (`server/server.js`) attaches the Lyzr `x-api-key`
  **server-side** and forwards to Lyzr. The key never reaches the browser.
- Local dev keeps working: `npm start` (`ng serve`) proxies `/api` →
  `localhost:3000` (see `proxy.conf.json`), so run the Node proxy on :3000.

## Security notes
- **API key**: lives only in `server/.env` (gitignored) → injected via compose
  `env_file`, never committed and never sent to the browser.
- **Agent allowlist**: `LYZR_ALLOWED_AGENTS` rejects unknown agent ids so the
  proxy can't be abused as a free Lyzr gateway. Leave it empty only for testing.
- **Rate limiting**: the proxy caps requests at 30/min/IP (`express-rate-limit`).
- **No user login**: anyone who can reach the site can use your Lyzr quota
  (within the rate limit). To restrict to known users, put an auth proxy
  (oauth2-proxy, Authentik, Cloudflare Access) in front, or add a login flow.

## TLS / HTTPS
The container serves **plain HTTP on 4770**. TLS is expected to be terminated by
an upstream reverse proxy / load balancer that forwards to this port.
To terminate TLS in the container instead, mount certs into the `frontend`
service and add an `ssl` listener to `nginx.conf`.
