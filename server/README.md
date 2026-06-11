# Panasa Intelligence Server — Backend Proxy

This small Express server does two jobs:

1. **Serves the built Angular app** (static files from `dist/`).
2. **Proxies agent calls to Lyzr**, attaching the `x-api-key` header
   **server-side**. The key lives only in the server's environment and is never
   delivered to the browser.

```
Browser ──▶  this server  ──▶  Lyzr API
(no key)     (static files + /api/agent       (x-api-key added here,
              proxy holding the key)            server-side only)
```

---

## ⚠️ Keep the API key out of git

The Lyzr key must never be committed. It lives only in `server/.env` (gitignored)
on the server, or in OS environment variables. Generate/rotate keys at
studio.lyzr.ai/configure/api-keys.

---

## Local development

Two processes: the Angular dev server (`:4200`) proxies `/api` to this server (`:3000`).

```powershell
# Terminal 1 — backend proxy
cd c:\tasks\huggingface-b4b\panasa_intelligence\server
npm install
copy .env.example .env        # then edit .env and set LYZR_API_KEY
npm start                     # http://localhost:3000

# Terminal 2 — Angular dev server
cd c:\tasks\huggingface-b4b\panasa_intelligence
npm install
npm start                     # http://localhost:4200  (proxies /api -> :3000)
```

Open http://localhost:4200.

---

## Production (single physical server, public internet)

### 1. Build the Angular app
```bash
cd panasa_intelligence
npm install
npm run build          # outputs dist/panasa-intelligence/browser
```

### 2. Configure and start the proxy
```bash
cd panasa_intelligence/server
npm install --omit=dev
cp .env.example .env   # set LYZR_API_KEY and the agent allowlist
npm start              # serves the built app AND /api on port 3000
```

The server serves the static build from `../dist/panasa-intelligence/browser`
by default. Override with `STATIC_DIR` if you build elsewhere.

### 3. Put HTTPS in front (required for public exposure)
Run nginx as a TLS-terminating reverse proxy (use certbot / Let's Encrypt for
the certificate):

```nginx
server {
    listen 443 ssl;
    server_name your-domain.example;

    ssl_certificate     /etc/letsencrypt/live/your-domain.example/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.example/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
# Redirect HTTP -> HTTPS
server { listen 80; server_name your-domain.example; return 301 https://$host$request_uri; }
```

### 4. Keep it running (Linux example — systemd)
Store the key outside the repo and never in the unit file directly:

```ini
# /etc/systemd/system/panasa-intelligence.service
[Unit]
Description=Panasa Intelligence proxy
After=network.target

[Service]
WorkingDirectory=/opt/panasa-intelligence/server
EnvironmentFile=/etc/panasa-intelligence.env   # contains LYZR_API_KEY=..., chmod 600, root-owned
ExecStart=/usr/bin/node server.js
Restart=always
User=panasa

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl enable --now panasa-intelligence
```

On **Windows Server**, set the env vars at the machine/service level (e.g. via
`setx /M` or the service account) and run with a process manager such as
[NSSM](https://nssm.cc/) or a Scheduled Task, pointing at `node server.js`.

---

## How the key is kept safe

| Concern | How it's handled |
|---|---|
| Key in browser bundle | Removed — frontend calls `/api/agent`, no key client-side |
| Key in source control | Lives in `.env` (gitignored) or OS env, never in the repo |
| Proxy abused as free Lyzr gateway | `LYZR_ALLOWED_AGENTS` allowlist rejects unknown agent ids |
| Request floods | `express-rate-limit` (30 req/min/IP by default) |
| Transport | Terminate TLS at nginx; redirect HTTP→HTTPS |

> **Note on public exposure:** the app currently has **no user login**, so anyone
> who can reach the site can use your Lyzr quota (within the rate limit). If this
> must be restricted to known users, add authentication — e.g. an SSO/auth proxy
> (Authentik, oauth2-proxy, Cloudflare Access) in front of nginx, or a login flow
> in the app. The rate limit + agent allowlist are mitigation, not access control.

---

## Environment variables

| Var | Required | Default | Purpose |
|---|---|---|---|
| `LYZR_API_KEY` | ✅ | — | Lyzr key, attached server-side |
| `LYZR_BASE_URL` | | prod inference URL | Lyzr endpoint |
| `LYZR_USER_ID` | | `panasa-ops` | user_id sent to Lyzr |
| `LYZR_ALLOWED_AGENTS` | | (empty = allow all) | comma-separated agent allowlist |
| `PORT` | | `3000` | listen port |
| `STATIC_DIR` | | `../dist/panasa-intelligence/browser` | built app location |
