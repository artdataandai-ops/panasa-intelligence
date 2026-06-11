'use strict';

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Load .env during local/dev runs. In production, set real OS environment
// variables (systemd EnvironmentFile, Windows env, secrets manager) instead.
try { require('dotenv').config(); } catch (_) { /* dotenv is optional */ }

const PORT = process.env.PORT || 3000;
const LYZR_API_KEY = process.env.LYZR_API_KEY;
const LYZR_BASE_URL = process.env.LYZR_BASE_URL
  || 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/';
const LYZR_USER_ID = process.env.LYZR_USER_ID || 'panasa-ops';
const ALLOWED_AGENTS = (process.env.LYZR_ALLOWED_AGENTS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

// Where the built Angular app lives (output of `ng build`).
const STATIC_DIR = process.env.STATIC_DIR
  || path.join(__dirname, '..', 'dist', 'panasa-intelligence', 'browser');

if (!LYZR_API_KEY) {
  console.error('FATAL: LYZR_API_KEY is not set. Copy server/.env.example to '
    + 'server/.env and set it, or export it in the environment before starting.');
  process.exit(1);
}

const app = express();

// On a physical server you'll sit behind nginx terminating TLS. Trusting the
// first proxy hop lets rate limiting see the real client IP via X-Forwarded-For.
app.set('trust proxy', 1);

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '256kb' }));

// Abuse mitigation for public exposure: cap requests per client IP.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' }
});

app.get('/healthz', (_req, res) => res.json({ ok: true }));

// The single proxied endpoint the browser calls. The API key is attached here,
// server-side only — it is never delivered to the browser.
app.post('/api/agent', apiLimiter, async (req, res) => {
  const { agent_id, message, session_id } = req.body || {};

  if (typeof agent_id !== 'string' || typeof message !== 'string') {
    return res.status(400).json({ error: 'agent_id and message are required.' });
  }
  if (ALLOWED_AGENTS.length && !ALLOWED_AGENTS.includes(agent_id)) {
    return res.status(403).json({ error: 'Agent not allowed.' });
  }

  const body = {
    user_id: LYZR_USER_ID,
    agent_id,
    message,
    session_id: session_id || `session-${Date.now()}`
  };

  // Match the 60s timeout the Angular client expects.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const upstream = await fetch(LYZR_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LYZR_API_KEY
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    const text = await upstream.text();
    res.status(upstream.status);
    res.type(upstream.headers.get('content-type') || 'application/json');
    return res.send(text);
  } catch (err) {
    const aborted = err && err.name === 'AbortError';
    console.error('Lyzr proxy error:', aborted ? 'upstream timeout' : err);
    return res.status(aborted ? 504 : 502).json({
      error: aborted
        ? 'The request took too long. Please try again.'
        : 'Upstream request failed.'
    });
  } finally {
    clearTimeout(timer);
  }
});

// Serve the built Angular static files.
app.use(express.static(STATIC_DIR));

// SPA fallback: any non-API route returns index.html so Angular routing works.
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Panasa Intelligence server listening on http://0.0.0.0:${PORT}`);
  console.log(`Serving static files from: ${STATIC_DIR}`);
  if (!ALLOWED_AGENTS.length) {
    console.warn('WARNING: LYZR_ALLOWED_AGENTS is empty — the proxy will forward '
      + 'ANY agent_id. Set it to lock the proxy down before public exposure.');
  }
});
