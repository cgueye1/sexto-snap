# ---------- Étape 1 : build (minification + obfuscation) ----------
# Le code source lisible n'existe QUE dans cette étape, jamais dans
# l'image finale : ce qui est servi est illisible à l'inspection.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install --no-fund --no-audit
COPY index.html camera-kit.mjs build.mjs privacy.html ./
RUN node build.mjs

# ---------- Étape 2 : serveur nginx ----------
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
# Fichiers produits par le build (index.html obfusqué + camera-kit.mjs)
COPY --from=build /app/dist/ /usr/share/nginx/html/
# privacy.html n'est pas transformé par build.mjs : on le copie directement
COPY --from=build /app/privacy.html /usr/share/nginx/html/privacy.html

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1

EXPOSE 80
