# MarketBridge

MarketBridge is a self-hosted web app (Next.js) to prepare sale listings once, store them locally with multiple images, and quickly reuse them across marketplaces.

The app is designed for personal use or small teams on private infrastructure.

## What It Does

- Create listings with structured fields: title, category, condition, size, price, description
- Handle real image uploads (JPG/PNG/WEBP), up to 10 images per listing
- Persist data in SQLite storage
- Edit and delete saved listings
- Expose copyable image URLs
- Export and import ZIP backups
- Installable as a PWA (manifest + service worker)
- Optional full purge mode (enabled only via environment variable)

## Tech Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- SQLite via `better-sqlite3`
- ZIP backup handling via `jszip`
- Server runtime: Node.js 20

## Data Architecture

Default persistent paths:

- SQLite database: `data/marketbridge.db`
- Uploaded images: `data/uploads/`

In the provided Docker setup, all `data/` content is mounted to the Docker named volume `marketbridge_data` (container path: `/app/data`).

## Requirements

- Node.js `20.x`
- npm
- Docker (optional, recommended for production)

## Local Development

```bash
npm install
npm run dev
```

Open: `http://localhost:3000`

Available scripts:

- `npm run dev`: development server
- `npm run build`: production build
- `npm run start`: run production build
- `npm run lint`: ESLint checks
- `npm run typecheck`: TypeScript checks

## Docker / Portainer

```bash
docker compose up --build
```

Open: `http://localhost:3001`

### Pre-built Docker Images

Ready-to-use images are also available:

- `ghcr.io/gioxx/marketbridge:latest`
- `gfsolone/marketbridge:latest`

## Environment Configuration

Supported variables:

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `production` (in Docker) | Node runtime mode |
| `NEXT_TELEMETRY_DISABLED` | `1` | Disable Next.js telemetry |
| `PORT` | `3000` | Internal app port |
| `SQLITE_PATH` | `./data/marketbridge.db` | SQLite database path |
| `MARKETBRIDGE_ENABLE_PURGE_ALL` | unset | If declared, enables UI button and API for full purge |

About `MARKETBRIDGE_ENABLE_PURGE_ALL`: any declared value enables it. If unset, full purge is disabled and API returns `403`.

## Main API Endpoints

These routes are used by the UI and do not include built-in authentication.

- `GET /api/listings`: list listings
- `POST /api/listings`: create listing (multipart/form-data)
- `PUT /api/listings/:id`: update listing
- `DELETE /api/listings/:id`: delete listing and linked images
- `GET /api/uploads/:name`: serve stored image
- `GET /api/backup/export`: export ZIP backup
- `POST /api/backup/import?mode=replace|merge`: import ZIP backup
- `GET /api/maintenance/purge`: full purge feature status
- `DELETE /api/maintenance/purge`: full purge (only if enabled)

## Backup and Restore

Backup structure:

- `manifest.json`
- `listings.json`
- `images/` folder with all linked images

Key constraints:

- Max import backup size: `50 MB`
- `replace` mode: fully replaces current data
- `merge` mode: merges backup data into current data
- Image names are validated server-side

Operational recommendation:

1. Run exports regularly
2. Keep at least one offsite copy
3. Periodically test restore on a separate environment

## Security (Important)

MarketBridge does **not** include built-in authentication, authorization, or user roles.

If you expose the app publicly without protection, anyone can:

- read listings and images
- create/update/delete listings
- import backups and overwrite data
- if enabled, trigger full purge

For production, run MarketBridge behind:

1. a reverse proxy
2. authentication (Basic Auth, SSO, OAuth2 Proxy, or equivalent)
3. HTTPS/TLS

## Recommended Deployment (Reverse Proxy + Auth)

### Option A: Caddy + Basic Auth

Example Caddyfile:

```caddy
marketbridge.example.com {
    encode zstd gzip

    basic_auth {
        admin $2a$14$REPLACE_WITH_BCRYPT_HASH
    }

    reverse_proxy 127.0.0.1:3001
}
```

Generate bcrypt hash with Caddy:

```bash
caddy hash-password --plaintext 'STRONG_PASSWORD'
```

### Option B: Nginx + Basic Auth

Example server block:

```nginx
server {
    listen 443 ssl http2;
    server_name marketbridge.example.com;

    ssl_certificate     /etc/letsencrypt/live/marketbridge.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/marketbridge.example.com/privkey.pem;

    auth_basic "Restricted";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Create `.htpasswd` (example):

```bash
htpasswd -c /etc/nginx/.htpasswd admin
```

## Hardening Checklist

1. Do not expose `3001` directly to the public Internet
2. Allow access only through an authenticated reverse proxy
3. Use strong passwords and rotate them periodically
4. Restrict access by IP where possible (VPN or allowlist)
5. Keep base images and containers updated
6. Run regular backups and restore drills
7. Enable `MARKETBRIDGE_ENABLE_PURGE_ALL` only when truly needed

## Full Purge Feature

If you declare this in `docker-compose.yml`:

```yaml
environment:
  MARKETBRIDGE_ENABLE_PURGE_ALL: "1"
```

the UI shows a dangerous action button that removes:

- all records in the SQLite database
- all stored uploaded images in `data/uploads/`

Use only in controlled environments.

## Project Structure (Essential)

- `src/app/page.tsx`: main UI
- `src/app/api/listings/route.ts`: listing list + create
- `src/app/api/listings/[id]/route.ts`: listing update + delete
- `src/app/api/uploads/[name]/route.ts`: image serving
- `src/app/api/backup/export/route.ts`: backup export
- `src/app/api/backup/import/route.ts`: backup import
- `src/app/api/maintenance/purge/route.ts`: feature flag + full purge
- `src/lib/db.ts`: SQLite access
- `src/lib/uploads.ts`: image file management
- `docker-compose.yml`: container deployment + persistent volume

## PWA

- Manifest: `public/manifest.webmanifest`
- Service worker: `public/sw.js`

For reliable install behavior on mobile, HTTPS is required.

## License

See `LICENSE`.
