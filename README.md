# cex-ai

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

## Running it

Redis must be running on the default port first.

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

Only accounts are persisted. Set up `backend/.env` from `.env.example`, then:

```bash
cd backend
npx prisma migrate dev --name init
```

## Markets

The engine seeds a single `SOL_INR` orderbook. Adding a market means creating
the Orderbook in `engine/src/trade/engine.ts` and listing it in
`frontend/src/markets.ts`.
