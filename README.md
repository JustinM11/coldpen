# ColdPen ✒️

AI-powered cold outreach email writer. Generate 3 high-converting cold email variations in seconds.

## What It Does

1. User signs up and picks a plan (Free: 5/day, Pro: unlimited at $29/month)
2. User inputs their product description, target audience, tone, and call-to-action goal
3. Claude AI generates 3 personalized cold email variations using different persuasion strategies
4. Users can copy, favorite, search, and reuse past generations

## Tech Stack

| Layer    | Technology                |
| -------- | ------------------------- |
| Frontend | React, Vite, Tailwind CSS |
| Backend  | Node.js, Express          |
| Database | PostgreSQL                |
| AI       | Anthropic Claude API      |
| Auth     | Clerk                     |
| Payments | Stripe                    |

## Project Structure

```
coldpen/
├── client/                 # React frontend
│   └── src/
│       ├── components/
│       │   ├── layout/     # Dashboard sidebar
│       │   └── pages/      # Generate, History, Analytics, Pricing
│       ├── hooks/          # Custom React hooks
│       └── lib/            # API client
│
└── server/                 # Express backend
    └── src/
        ├── routes/         # URL mapping
        ├── controllers/    # Request/response handling
        ├── services/       # Business logic (Claude API)
        ├── models/         # Database queries
        ├── middleware/      # Auth, rate limiting, errors
        └── config/         # Database connection
```

## Architecture

Every request flows through layers, each with one job:

```
Request → Routes → Middleware → Controller → Service → Model → Database
                   (auth)       (validate)   (Claude)   (SQL)
                   (rate limit)
```

## API Endpoints

| Method | URL                                  | Description                 |
| ------ | ------------------------------------ | --------------------------- |
| POST   | /api/emails/generate                 | Generate 3 email variations |
| GET    | /api/emails                          | Get email history           |
| GET    | /api/emails/:id                      | Get one email               |
| PATCH  | /api/emails/:id/favorite             | Toggle favorite             |
| PATCH  | /api/emails/:id/copy                 | Track copy                  |
| DELETE | /api/emails/:id                      | Delete email                |
| GET    | /api/emails/stats                    | Get usage stats             |
| GET    | /api/users/me                        | Get user profile            |
| POST   | /api/billing/create-checkout-session | Start Stripe payment        |
| POST   | /api/billing/create-portal-session   | Manage subscription         |
| GET    | /api/analytics/dashboard             | Get analytics               |

## Database Schema

**users** — Synced from Clerk via webhooks

| Column                 | Type    | Purpose                        |
| ---------------------- | ------- | ------------------------------ |
| id                     | UUID    | Primary key                    |
| clerk_id               | VARCHAR | Links to Clerk account         |
| email, name            | VARCHAR | Profile info                   |
| plan                   | VARCHAR | 'free' or 'pro'                |
| stripe_customer_id     | VARCHAR | Links to Stripe (unique)       |
| stripe_subscription_id | VARCHAR | Links to subscription (unique) |
| generations_today      | INT     | Daily rate limit counter       |

**emails** — One row per generation with 3 variations

| Column              | Type    | Purpose                              |
| ------------------- | ------- | ------------------------------------ |
| id                  | UUID    | Primary key                          |
| user_id             | UUID    | Foreign key to users                 |
| product_description | TEXT    | User input                           |
| target_audience     | TEXT    | User input                           |
| tone                | VARCHAR | professional, casual, friendly, bold |
| cta_goal            | TEXT    | User input                           |
| variations          | JSONB   | Array of 3 email objects             |
| is_favorited        | BOOLEAN | User bookmark                        |
| copied_count        | INT     | Copy tracking                        |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Accounts: [Clerk](https://clerk.com), [Stripe](https://stripe.com), [Anthropic](https://console.anthropic.com)

### Setup

```bash
# Clone the repo
git clone https://github.com/JustinM11/coldpen.git
cd coldpen

# Backend
cd server
npm install
cp .env.example .env        # Fill in your API keys
npm run migrate              # Create database tables
npm run dev                  # Starts on localhost:3001

# Frontend (new terminal)
cd client
npm install
cp .env.example .env        # Fill in Clerk publishable key
npm run dev                  # Starts on localhost:5173
```

### Environment Variables

**server/.env**

```
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:password@localhost:5432/coldpen
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
```

**client/.env**

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=
```

## Features

- **Email Generation** — Claude AI creates 3 variations with different persuasion strategies (pain point lead, social proof hook, direct value prop)
- **One-Click Copy** — Copy any variation to clipboard
- **Favorites** — Bookmark best-performing emails
- **History** — Search, filter, and reuse past generations
- **Rate Limiting** — Free: 5/day, Pro: 1000/day
- **Analytics** — Track generations, copies, and favorites
- **Auth** — Clerk handles signup, login, and session management
- **Payments** — Stripe Checkout for Pro subscriptions

## Built By

Justin Mangawang — [GitHub](https://github.com/JustinM11)
