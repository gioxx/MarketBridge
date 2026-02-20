# MarketBridge

Mini progetto Next.js + Tailwind per simulare la pubblicazione di un prodotto in stile Vinted con:
- upload reale immagini (multiple, max 10)
- salvataggio persistente su SQLite
- modifica successiva dell'entry

## Persistenza

- Database: `data/marketbridge.db`
- Immagini: `data/uploads/`

## Avvio locale

```bash
npm install
npm run dev
```

Apri `http://localhost:3000`.

## Avvio con Docker / Portainer

```bash
docker compose up --build
```

Apri `http://localhost:3001`.

Nel compose c'e un volume Docker named `marketbridge_data` montato su `/app/data` per mantenere persistenza tra restart/redeploy.
