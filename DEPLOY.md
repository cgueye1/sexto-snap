# Déployer Seddo sur Dokploy

## Fichiers de déploiement

- `Dockerfile` — build en 2 étapes : **obfuscation automatique** puis nginx
- `build.mjs` + `package.json` — le script qui rend le code illisible
- `nginx.conf` — compression gzip, cache intelligent, en-têtes de sécurité
- `docker-compose.yml` — optionnel, si vous préférez le mode Compose

## Protection du code

À chaque déploiement, le Dockerfile minifie et obfusque le code
(identifiants remplacés par de l'hexadécimal, chaînes encodées en base64
dans un tableau mélangé). Quelqu'un qui fait "Inspecter" ne verra qu'une
bouillie illisible. Le fichier `index.html` lisible reste uniquement dans
votre dépôt Git — il n'est jamais servi.

⚠️ À savoir honnêtement : aucun code navigateur n'est secret à 100 %
(le navigateur doit l'exécuter). L'obfuscation décourage la copie mais le
jeton Camera Kit reste techniquement extractible — c'est inhérent à
Camera Kit Web. La vraie protection du jeton se fait dans le portail
Snap (my-lenses.snapchat.com) : **restreignez le jeton à votre domaine**
pour qu'il soit inutilisable ailleurs.

## Étapes dans Dokploy

1. Poussez ce dossier dans un dépôt Git (GitHub/GitLab).
2. Dans Dokploy : **Create Application** → connectez le dépôt.
3. Build Type : **Dockerfile** (détecté automatiquement).
4. Dans **Domains**, ajoutez votre domaine avec HTTPS activé
   (Let's Encrypt) et **port conteneur : 80**.
5. Deploy.

⚠️ **HTTPS est obligatoire** : la caméra (`getUserMedia`) ne fonctionne
que sur une page sécurisée. Dokploy/Traefik s'en charge via Let's Encrypt,
assurez-vous juste que le domaine pointe bien vers votre serveur (DNS A).

## Ce que fait la config nginx

- **`index.html` jamais mis en cache** → vos mises à jour sont visibles
  immédiatement sur tous les téléphones, fini les vieilles versions
  servies par le cache.
- **`camera-kit.mjs` en cache 1 an (immutable)** → chargement quasi
  instantané dès la 2ᵉ visite ; gzip le fait passer d'environ 2 Mo à
  ~500 Ko à la première visite.
- **Healthcheck `/healthz`** → Dokploy sait si le conteneur est vivant
  et peut le redémarrer/faire du zero-downtime.
- **Permissions-Policy** → autorise la caméra pour la page, bloque
  micro et géolocalisation.

## Test local avant déploiement

```bash
docker build -t seddo .
docker run --rm -p 8080:80 seddo
# http://localhost:8080  (la caméra marche sur localhost sans HTTPS)
curl http://localhost:8080/healthz   # → ok
```

Sans Docker, pour produire le build obfusqué à la main (dossier `dist/`) :

```bash
npm install
npm run build
```
