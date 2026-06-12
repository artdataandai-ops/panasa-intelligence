# --- Panasa frontend: build the Angular app, serve it (and proxy the API) with nginx ---
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# base-href is "/panasa-intelligence/" so every asset is emitted under that prefix
# and the relative API call (environment.apiUrl = "api/agent") resolves to
# /panasa-intelligence/api/agent. This MUST match the public path the app is
# served under (https://ai.arttechgroup.com:7777/panasa-intelligence).
RUN npm run build -- --base-href=/panasa-intelligence/

FROM nginx:alpine
# nginx serves the SPA on :8080 and reverse-proxies /panasa-intelligence/api -> backend:3000.
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Angular 17 application builder emits the browser bundle under dist/<name>/browser.
COPY --from=build /app/dist/panasa-intelligence/browser /usr/share/nginx/html/panasa-intelligence

EXPOSE 8080
