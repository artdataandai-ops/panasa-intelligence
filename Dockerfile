# --- Panasa frontend: build the Angular app, serve it (and proxy the API) with nginx ---
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# base-href is "/panasa/" so every asset is emitted under /panasa/ and the
# relative API call (environment.apiUrl = "api/agent") resolves to /panasa/api/agent.
RUN npm run build -- --base-href=/panasa/

FROM nginx:alpine
# nginx serves the SPA on :8080 and reverse-proxies /panasa/api -> backend:3000.
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Angular 17 application builder emits the browser bundle under dist/<name>/browser.
COPY --from=build /app/dist/panasa-intelligence/browser /usr/share/nginx/html/panasa

EXPOSE 8080
