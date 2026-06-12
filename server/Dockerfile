# --- Panasa backend: Express proxy that holds the Lyzr API key server-side ---
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

# Serves /api/agent (proxy) and /healthz. Static SPA + path prefix are handled
# by the nginx frontend, so this process only ever sees the proxied API traffic.
CMD ["node", "server.js"]
