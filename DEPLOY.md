# Panasa Intelligence — Production Deployment

Public URL: **`https://ai.arttechgroup.com:7777/panasa-intelligence/`**

```
browser ──TLS :7777──►  host nginx  ──►  frontend (nginx) :8080  ──/…/api──►  backend (node) :3000  ──►  Lyzr
        (nginx-host.conf)        127.0.0.1:4770       serves Angular SPA        attaches API key server-side
```

- **host nginx** (`nginx-host.conf`) terminates TLS on `:7777` and proxies to the container.
- **frontend** container (`Dockerfile` + `nginx.conf`) serves the Angular SPA under
  `/panasa-intelligence/` and proxies `/panasa-intelligence/api/` → backend.
- **backend** container (`server/Dockerfile`) is the Express proxy that attaches the Lyzr key.

The `/panasa-intelligence` prefix is the same end-to-end (the app is built with
`--base-href=/panasa-intelligence/`), so the host nginx is a clean pass-through.

## Prerequisites
- Docker + Docker Compose, and nginx on the host (for TLS).
- A TLS cert for `ai.arttechgroup.com` (e.g. Let's Encrypt / certbot).
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

## Run the stack
```bash
./deploy.sh               # pull, build, start, health-check (one shot)

# ...or the raw compose commands:
docker compose build      # build both images
docker compose up -d      # start detached (binds 127.0.0.1:4770)
docker compose ps         # check status
docker compose logs -f    # tail logs
docker compose down       # stop & remove
```

## Put TLS in front (host nginx)
```bash
sudo cp nginx-host.conf /etc/nginx/conf.d/panasa-intelligence.conf
# edit the ssl_certificate paths if not using the Let's Encrypt defaults
sudo nginx -t && sudo systemctl reload nginx
```

## Smoke test
```bash
# direct to the container (loopback, plain HTTP):
curl http://localhost:4770/panasa-intelligence/healthz   # -> 200 {"ok":true}
curl -I http://localhost:4770/panasa-intelligence/        # -> 200 (SPA)

# through the public TLS endpoint:
curl https://ai.arttechgroup.com:7777/panasa-intelligence/healthz   # -> 200
curl -I https://ai.arttechgroup.com:7777/panasa-intelligence/        # -> 200
curl -I https://ai.arttechgroup.com:7777/                            # -> 302 -> /panasa-intelligence/
```

## How the path prefix works
- The Angular app is built with `--base-href /panasa-intelligence/` (frontend
  `Dockerfile`), so `<base href>` and all assets live under that prefix.
- API calls use a **relative** URL — `environment.apiUrl = 'api/agent'`
  (`src/environments/environment.ts`) — which resolves against `<base href>`:
  `/panasa-intelligence/api/agent` in the container, `/api/agent` during local dev.
- The frontend nginx (`nginx.conf`) serves the SPA at `/panasa-intelligence/` and
  reverse-proxies `/panasa-intelligence/api/*` → `backend:3000/api/*` (prefix stripped).
- The Node proxy (`server/server.js`) attaches the Lyzr `x-api-key` **server-side**
  and forwards to Lyzr. The key never reaches the browser. It trusts 2 proxy hops
  (host nginx + container nginx) so rate limiting keys off the real client IP.
- Local dev is unchanged: `npm start` (`ng serve`, base `/`) proxies `/api` →
  `localhost:3000` (see `proxy.conf.json`), so run the Node proxy on :3000.

## Security notes
- **API key**: lives only in `server/.env` (gitignored) → injected via compose
  `env_file`, never committed and never sent to the browser.
- **Container exposure**: the frontend is published on `127.0.0.1:4770` only, so it
  is reachable solely by the host nginx — never directly from the internet.
- **Agent allowlist**: `LYZR_ALLOWED_AGENTS` rejects unknown agent ids so the proxy
  can't be abused as a free Lyzr gateway. Leave it empty only for testing.
- **Rate limiting**: the proxy caps requests at 30/min/IP (`express-rate-limit`).
- **No user login**: anyone who can reach the site can use your Lyzr quota (within
  the rate limit). To restrict to known users, put an auth proxy (oauth2-proxy,
  Authentik, Cloudflare Access) in front, or add a login flow.
