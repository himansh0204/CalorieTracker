# CalTrack - Calorie Tracker App

A mobile-first PWA for tracking daily calories and macros, built with React + Vite (frontend) and Node.js + Express + PostgreSQL (backend).

## Live App

- Production URL: https://calorie-tracker-three-delta.vercel.app

## Features

- Google Sign-In (Google Identity + backend token verification)
- Daily calorie and macro progress (protein, carbs, fat)
- Food search powered by Open Food Facts (2M+ products)
- Barcode scanner via device camera
- 30-day meal history
- Customizable daily goals
- Built-in analytics events (meal logged/deleted, settings updated)
- Installable PWA (service worker + manifest)

## Architecture

### Frontend

- React 18 + Vite
- React Router v6
- Context + hooks for auth, meals, and settings
- API calls to `/api/*` with JWT bearer tokens

### Backend

- Node.js + Express (in `api/`)
- PostgreSQL via `pg` (managed Neon in production)
- JWT auth middleware
- Google token verification via `google-auth-library`
- REST endpoints for auth, meals, settings, analytics

### Database

Tables:
- `users`
- `user_settings`
- `meals`
- `analytics_events`

Schema lives in `db/schema.sql` and is applied with `npm run db:migrate`.

## Environment Variables

Create `.env` from `.env.example` and set values:

```bash
cp .env.example .env
```

Required variables:

```bash
# Frontend
VITE_API_URL=http://localhost:3001/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Backend
NODE_ENV=development
PORT=3001
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_strong_random_secret
GOOGLE_CLIENT_ID=your_google_client_id
FRONTEND_URL=http://localhost:5173
```

## Local Development

```bash
npm install
npm run db:migrate
npm run dev
```

`npm run dev` starts both:
- frontend: `http://localhost:5173`
- backend: `http://localhost:3001`

## API Endpoints

- `POST /api/auth/google` - Google credential exchange, returns app JWT
- `GET /api/health` - health check
- `GET /api/meals` - fetch meals by date range
- `POST /api/meals` - create meal log
- `DELETE /api/meals/:mealId` - delete meal log
- `GET /api/settings` - fetch user goals
- `POST /api/settings` - upsert user goals
- `GET /api/analytics/summary` - analytics summary
- `POST /api/analytics/event` - track custom event

## Deployment (Vercel)

This repo is configured for Vercel full-stack deployment:

- Frontend static output served from `dist/`
- `/api/*` rewritten to Express entry at `api/index.js`
- SPA fallback to `index.html`

Deploy command:

```bash
npx vercel deploy --prod --yes
```

Before deploying, set env vars in Vercel:
- `DATABASE_URL`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_CLIENT_ID`
- `FRONTEND_URL`

## Project Structure

```text
api/
    index.js
    lib/db.js
    middleware/auth.js
    routes/
        auth.js
        meals.js
        settings.js
        analytics.js
db/
    schema.sql
    migrate.js
src/
    context/
    hooks/
    pages/
    components/
    services/
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React 18 + Vite |
| Backend | Node.js + Express |
| Auth | Google Identity + JWT |
| Database | PostgreSQL (Neon) |
| Food Data | Open Food Facts API |
| Barcode Scan | @zxing/library |
| Routing | React Router v6 |
| Styling | CSS Modules |
| Hosting | Vercel |
