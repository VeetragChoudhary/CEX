# cex

A spot centralized exchange. Four services: a REST api, an in-memory matching
engine, a websocket fanout server, and a React frontend.

## How it fits together

```
frontend  --REST-->  backend  --redis queue-->  engine
    ^                                             |
    |                                             | redis pub/sub
    +---------------- ws  <-----------------------+
```

Redis is only a message bus. The orderbook and balances live in memory inside
the engine process, so they reset when it restarts.

## Running it with Docker

Brings up all four services plus Redis and Postgres. Migrations are applied
automatically on backend startup.

```bash
cp .env.example .env
# set JWT_SECRET in .env, then:
docker compose up --build
```

- frontend: http://localhost:5173
- backend: http://localhost:3000
- ws: ws://localhost:3001

Ports are configurable in `.env`. The frontend talks to the api from the
browser, so `VITE_API_URL` and `VITE_WS_URL` are baked in at image build time
from the host ports — changing `BACKEND_PORT` or `WS_PORT` needs a rebuild.

Postgres data lives in the `postgres-data` volume. `docker compose down -v`
drops it. The orderbook is in memory, so it always resets with the engine.

## Running it without Docker

Redis and Postgres must be running on their default ports first.

```bash
# each in its own terminal
cd engine   && npm run dev
cd backend  && npm run dev
cd ws       && npm run dev
cd frontend && npm run dev
```

- backend: http://localhost:3000
- ws: ws://localhost:3001
- frontend: http://localhost:5173

## Database

Only accounts are persisted. Under Docker this is handled automatically. For a
local run, set up `backend/.env` from `backend/.env.example`, then:

```bash
cd backend
npx prisma migrate dev --name init
```

## Markets

The engine seeds a single `SOL_INR` orderbook. Adding a market means creating
the Orderbook in `engine/src/trade/engine.ts` and listing it in
`frontend/src/markets.ts`.
