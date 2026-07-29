# ---------- Étape 1 : build (minification + obfuscation) ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install --no-fund --no-audit
COPY index.html camera-kit.mjs build.mjs privacy.html ./
RUN node build.mjs

# ---------- Étape 2 : serveur nginx ----------
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/ /usr/share/nginx/html/
COPY --from=build /app/privacy.html /usr/share/nginx/html/privacy.html

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1

EXPOSE 80
