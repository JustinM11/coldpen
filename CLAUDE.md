# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Both servers must run simultaneously. There is no monorepo runner — open two terminals.

```bash
# Backend (port 3001)
cd server && npm run dev        # node --watch, no nodemon

# Frontend (port 5173)
cd client && npm run dev        # Vite

# Database migration (run once, or after schema changes)
cd server && npm run migrate

# Lint (frontend only — no server-side linter configured)
cd client && npm run lint

# Production build
cd client && npm run build
```

There is no test suite.

## Environment Variables

`server/.env` and `client/.env` are required. The server will crash on startup if `DATABASE_URL` is missing or the database is unreachable. Set `MOCK_AI=true` in `server/.env` to skip real Claude API calls during local development — the mock returns fixed variations with zero token usage.

The Claude model ID is hardcoded in `server/src/services/ai.service.js` as `"claude-sonnet-4-20250514"`.

## Architecture

### Request flow

```
HTTP request
  → index.js middleware stack (helmet, cors, express.raw for webhooks, express.json, clerkMiddleware)
  → Route file (routes/*.routes.js)
  → protect middleware array [requireAuth(), attachUser]  ← spreads into route as ...protect
  → rateLimitByPlan (generate route only)
  → Controller method (controllers/email.controller.js)
  → Service (services/ai.service.js) and/or Model (models/email.model.js)
  → PostgreSQL via db.query()
```

### Auth middleware

`protect` in `middleware/auth.js` is an **array** `[requireAuth(), attachUser]`, not a single function. Routes consume it as `router.post("/route", ...protect, handler)`. `requireAuth()` is from `@clerk/express` and depends on `clerkMiddleware()` having already run — it is registered in `index.js` before all route registrations. `attachUser` resolves the Clerk user ID to a DB row (upserts on first login) and attaches it to `req.user`.

### Rate limiting

`rateLimitByPlan` in `middleware/rateLimit.js` uses a single atomic `UPDATE ... WHERE (new day OR under limit) ... RETURNING` to both reset the daily counter and increment it. Zero rows returned means the user is blocked. This prevents the race condition that would allow concurrent requests to both pass the check simultaneously.

### Webhook body parsing

`/api/webhooks/stripe` and `/api/webhooks/clerk` both need the raw request body for HMAC verification. Both paths are given `express.raw({ type: "application/json" })` in `index.js` **before** the global `express.json()` call. The Clerk handler passes `req.body` (a `Buffer`) directly to `wh.verify()` — do not re-serialize it.

### Email variations

`variations` is a `JSONB` column. It is inserted via `JSON.stringify(variations)` and returned as an already-parsed JS array by the `pg` driver. Each element has `{ label, subject, body, strategy }`.

### Frontend API client

`client/src/lib/api.js` wraps `fetch`. Every authenticated call passes `{ getToken }` from Clerk's `useAuth()` hook as part of the options object — the client calls `getToken()` internally and attaches it as `Authorization: Bearer <token>`.

### "Reuse inputs" flow

`HistoryPage` navigates to `/dashboard` with React Router state `{ prefill: { productDescription, targetAudience, tone, ctaGoal } }`. `GeneratePage` reads `useLocation().state?.prefill` as the initial value of its form state.

### History pagination

`HistoryPage` uses two effects: one resets `offset` to `0` and clears `emails` when filters (`debouncedSearch`, `favoritesOnly`) change; the other fetches and either replaces (when `offset === 0`) or appends (when `offset > 0`). A `cancelled` flag on each effect prevents stale responses from being applied after a newer fetch has started.

### Pricing → Stripe checkout

`PricingPage` calls `POST /api/billing/create-checkout-session`, which creates a Stripe Checkout session with `client_reference_id` set to the internal user UUID. On success, the frontend redirects to `data.url`. The `checkout.session.completed` Stripe webhook uses `client_reference_id` to locate the right DB row and upgrade the user's plan to `'pro'`.
