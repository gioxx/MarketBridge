# MarketBridge

A lightweight Next.js + Tailwind app to prepare marketplace listings with:
- real image uploads (multiple, up to 10)
- persistent SQLite storage
- editable saved entries
- installable PWA support (manifest + service worker)

## Persistence

- Database: `data/marketbridge.db`
- Images: `data/uploads/`

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Run with Docker / Portainer

```bash
docker compose up --build
```

Open `http://localhost:3001`.

The compose file includes a Docker named volume `marketbridge_data` mounted at `/app/data` so data survives restarts/redeploys.

## Install as an app (PWA)

- Local: on Chrome/Edge you can test installability from `http://localhost:3000`.
- Production: HTTPS is required for reliable install behavior on Android/iOS.
