# 🚀 Quick Start Guide

## 5-Minute Setup

### 1. Get Google OAuth Credentials
Go to: https://console.cloud.google.com
- Create/select project → Enable "Google+ API"
- Credentials → OAuth 2.0 Client ID (Web)
- Authorized URIs: `http://localhost:5173`
- Copy Client ID → Keep it handy

### 2. Setup Local Database (Pick One)

**Homebrew (macOS):**
```bash
brew install postgresql
brew services start postgresql
createdb calorietracker
psql calorietracker -c "CREATE USER calorietracker WITH PASSWORD 'password';"
```

**Docker:**
```bash
docker run --name postgres-caltrack -e POSTGRES_PASSWORD=password -e POSTGRES_DB=calorietracker -p 5432:5432 -d postgres:15
```

### 3. Create .env

```bash
# Copy example
cp .env.example .env

# Edit .env and add:
# VITE_GOOGLE_CLIENT_ID=your-client-id
# GOOGLE_CLIENT_ID=your-client-id
# JWT_SECRET=<run: openssl rand -base64 32>
```

### 4. Install & Run

```bash
npm install
npm run db:migrate
npm run dev
```

### 5. Test
- Open http://localhost:5173
- Click "Continue with Google"
- Sign in and enjoy! ✨

---

## Useful Commands

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Start frontend (5173) + backend (3001) |
| `npm run build` | Build for production |
| `npm run db:migrate` | Create/update database schema |
| `npm run setup` | Run interactive setup (first time) |

## Backend API

**All require header:** `Authorization: Bearer <jwt-token>`

```
POST   /api/auth/google        → Login
POST   /api/meals              → Log meal
GET    /api/meals?startDate=.. → Fetch meals
DELETE /api/meals/:id          → Delete meal
GET    /api/settings           → Get goals
POST   /api/settings           → Update goals
GET    /api/analytics/summary  → User stats
POST   /api/analytics/event    → Track event
```

## Project Structure

```
api/           ← Backend (Express.js)
db/            ← Database (PostgreSQL migrations)
src/           ← Frontend (React)
.env           ← Your secrets (NOT in git)
BACKEND_SETUP.md    ← Full documentation
MIGRATION_COMPLETE.md ← What changed
```

## Debugging

| Issue | Solution |
|-------|----------|
| "Can't connect to API" | Check `VITE_API_URL` in `.env`, backend running on 3001? |
| "401 Unauthorized" | Token expired? Try `localStorage.clear()` in console |
| "Database connection failed" | PostgreSQL running? Check `DATABASE_URL` |
| "CORS error" | Check `api/index.js` cors config includes your frontend URL |

## Deployment

When ready:

```bash
git push origin main
# Import to Vercel
# Add .env variables
# Deploy!
```

See `BACKEND_SETUP.md` "Deployment" section for details.

---

## Key Changes from Firebase

| Firebase | Custom Backend |
|----------|---|
| Firebase Auth | Google OAuth 2.0 + JWT |
| Firestore | PostgreSQL |
| Firebase SDK | REST API |
| Firebase Hosting | Vercel |

**Your code:** Already updated! Just add `.env` and run.

---

## Questions?

📖 **Full Guide:** `BACKEND_SETUP.md`
📋 **What Changed:** `MIGRATION_COMPLETE.md`
🐛 **Issues:** Check terminal + browser console
💬 **API Details:** See API section above

Happy tracking! 🥗
