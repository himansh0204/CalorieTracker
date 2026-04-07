# Backend Migration Summary

## What Just Happened ✅

You've successfully migrated **CalorieTracker** from **Firebase to a custom Node.js + PostgreSQL backend** with Google OAuth authentication and full analytics tracking.

## What Was Changed

### Backend Created (NEW)
✅ **`api/`** – Express.js REST API server with:
- `api/index.js` – Main server
- `api/middleware/auth.js` – JWT token verification
- `api/routes/auth.js` – Google OAuth 2.0 + JWT exchange
- `api/routes/meals.js` – Meal logging CRUD
- `api/routes/settings.js` – Goal management
- `api/routes/analytics.js` – Analytics dashboard & event tracking

### Database Created (NEW)
✅ **`db/`** – PostgreSQL schema with:
- `db/schema.sql` – Tables: users, user_settings, meals, analytics_events
- `db/migrate.js` – Automated migration runner

### Frontend Updated
✅ **`src/context/AuthContext.jsx`** – Now uses Google OAuth + JWT instead of Firebase Auth
✅ **`src/context/FoodLogContext.jsx`** – Now calls REST API (`/api/meals`) instead of Firestore
✅ **`src/hooks/useSettings.js`** – Now calls REST API (`/api/settings`) instead of Firestore
✅ **`src/pages/Login.jsx`** – Updated for Google Sign-In library
✅ **`index.html`** – Added Google Sign-In script tag

### Configuration Files
✅ **`package.json`** – Added backend dependencies (express, pg, jsonwebtoken, google-auth-library)
✅ **`.env.example`** – Updated with new environment variables
✅ **`vercel.json`** – NEW: Vercel deployment config for both frontend + backend
✅ **`BACKEND_SETUP.md`** – Comprehensive setup guide

---

## Quick Next Steps

### 1️⃣ Get Google OAuth Credentials (Required)

Go to [Google Cloud Console](https://console.cloud.google.com):

1. Create/select project
2. **Enable APIs** → `Google+ API`
3. **Credentials** → `Create OAuth 2.0 Client ID` → `Web Application`
4. **Authorized redirect URIs** add:
   ```
   http://localhost:5173
   http://localhost:3000
   ```
5. **Copy your Client ID** (like: `123456789.apps.googleusercontent.com`)

### 2️⃣ Set Up Local PostgreSQL

**Option A: Homebrew (easiest for macOS)**
```bash
brew install postgresql
brew services start postgresql
createdb calorietracker
psql calorietracker -c "CREATE USER calorietracker WITH PASSWORD 'password';"
```

**Option B: Docker**
```bash
docker run --name postgres-caltrack -e POSTGRES_PASSWORD=password -e POSTGRES_DB=calorietracker -p 5432:5432 -d postgres:15
```

### 3️⃣ Create `.env` File

Create a file named `.env` in your project root:

```env
VITE_API_URL=http://localhost:3001/api
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE

NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://calorietracker:password@localhost:5432/calorietracker
JWT_SECRET=your-random-secret-key-min-32-characters-long
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
FRONTEND_URL=http://localhost:5173
```

Replace:
- `YOUR_GOOGLE_CLIENT_ID_HERE` with your actual Client ID from step 1
- `password` with your PostgreSQL password (if different)
- `JWT_SECRET` with a random string (run: `openssl rand -base64 32`)

### 4️⃣ Install Dependencies

```bash
npm install
```

### 5️⃣ Run Database Migrations

```bash
npm run db:migrate
```

This creates all tables automatically.

### 6️⃣ Start Development Server

```bash
npm run dev
```

This starts both:
- **Frontend**: http://localhost:5173 (Vite)
- **Backend**: http://localhost:3001 (Express)

### 7️⃣ Test Login Flow

1. Open http://localhost:5173
2. Click "Continue with Google"
3. Sign in with your Google account
4. Should redirect to Dashboard

---

## Architecture Overview

```
┌──────────────────────┐
│  React + Vite        │
│  (localhost:5173)    │ ← Frontend
└──────────┬───────────┘
           │ HTTP REST API
           ▼
┌──────────────────────────────┐
│  Express.js Backend          │
│  (localhost:3001)            │ ← Custom API
│  • Auth (Google OAuth)       │
│  • Meals CRUD                │
│  • Goals Management          │
│  • Analytics Tracking        │
└──────────┬───────────────────┘
           │ SQL
           ▼
┌──────────────────────┐
│  PostgreSQL          │
│  (localhost:5432)    │ ← Database
│  4 tables:           │
│  - users             │
│  - user_settings     │
│  - meals             │
│  - analytics_events  │
└──────────────────────┘
```

---

## Key Files Reference

| File | Purpose | Updated |
|------|---------|---------|
| `api/index.js` | Express server | ✅ NEW |
| `api/routes/*` | API endpoints | ✅ NEW |
| `api/lib/db.js` | DB connection pool | ✅ NEW |
| `api/middleware/auth.js` | JWT verification | ✅ NEW |
| `db/schema.sql` | PostgreSQL schema | ✅ NEW |
| `db/migrate.js` | Migration runner | ✅ NEW |
| `src/context/AuthContext.jsx` | Auth logic | ✅ Updated |
| `src/context/FoodLogContext.jsx` | Meal logging | ✅ Updated |
| `src/hooks/useSettings.js` | Goal management | ✅ Updated |
| `src/pages/Login.jsx` | Login screen | ✅ Updated |
| `package.json` | Dependencies | ✅ Updated |
| `.env.example` | Environment template | ✅ Updated |
| `vercel.json` | Deployment config | ✅ NEW |
| `BACKEND_SETUP.md` | Full setup guide | ✅ NEW |

---

## API Specification

### Authentication
```
POST /api/auth/google
Body: { idToken: "google-id-token" }
Response: { ok: true, token: "jwt-token", user: {...} }
```

### Meals
```
POST   /api/meals              (Log meal)
GET    /api/meals?startDate=.. (Fetch meals)
DELETE /api/meals/:id          (Delete meal)
```

### Settings
```
GET  /api/settings  (Get goals)
POST /api/settings  (Update goals)
```

### Analytics
```
GET  /api/analytics/summary    (User stats)
POST /api/analytics/event      (Track event)
```

All requests require: `Authorization: Bearer <jwt-token>`

---

## Analytics Tracked

Your app now has a dedicated `analytics_events` table that automatically tracks:

- ✅ `meal_logged` – When user logs a meal
- ✅ `meal_deleted` – When user removes a meal
- ✅ `settings_updated` – When user changes goals
- ✅ Custom events – Via `/api/analytics/event`

Query examples:
```sql
-- Total meals per user
SELECT user_id, COUNT(*) FROM analytics_events 
WHERE event_type = 'meal_logged' GROUP BY user_id;

-- Daily active users
SELECT DATE(created_at), COUNT(DISTINCT user_id) 
FROM analytics_events GROUP BY DATE(created_at);

-- User engagement score
SELECT user_id, COUNT(*) as interactions FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY user_id ORDER BY interactions DESC;
```

---

## Deployment to Vercel (Later)

When ready to go live:

1. **Push to GitHub** – `git push origin main`
2. **Create PostgreSQL** – Use Vercel Postgres or Neon
3. **Import to Vercel** – Connect your GitHub repo
4. **Set Environment Variables** – Add `.env` values to Vercel
5. **Deploy** – Click "Deploy"

See `BACKEND_SETUP.md` section "Deployment to Vercel" for full steps.

---

## Troubleshooting

**"Port 3001 already in use"**
```bash
lsof -i :3001
kill -9 <PID>
```

**"CORS error" or "Can't reach API"**
- Check `VITE_API_URL` in `.env` matches where backend is running
- Check backend is running: `npm run dev`
- Check CORS origins in `api/index.js`

**"Database connection failed"**
```bash
# Test connection
psql $DATABASE_URL

# Start PostgreSQL (if not running)
brew services start postgresql
```

**"JWT token is invalid"**
- Clear localStorage: `localStorage.clear()` in console
- Log out and log back in
- Check `JWT_SECRET` matches in both frontend and backend

---

## What's Next?

1. ✅ **Complete** – Backend fully integrated
2. ✅ **Complete** – Google OAuth ready
3. ✅ **Complete** – Analytics tracking
4. 🚀 **Ready** – Deploy to Vercel
5. 🤖 **Optional** – Add OpenAI integration (Cloud Function)

---

## File Structure

```
CalorieTracker/
├── api/                    ← BACKEND (NEW)
│   ├── index.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── meals.js
│   │   ├── settings.js
│   │   └── analytics.js
│   ├── middleware/
│   │   └── auth.js
│   └── lib/
│       └── db.js
├── db/                     ← DATABASE (NEW)
│   ├── schema.sql
│   └── migrate.js
├── src/                    ← FRONTEND
│   ├── context/
│   │   ├── AuthContext.jsx     (UPDATED)
│   │   └── FoodLogContext.jsx  (UPDATED)
│   ├── hooks/
│   │   └── useSettings.js      (UPDATED)
│   ├── pages/
│   │   ├── Login.jsx           (UPDATED)
│   │   ├── Dashboard.jsx
│   │   ├── Log.jsx
│   │   ├── Scanner.jsx
│   │   ├── Settings.jsx
│   │   └── History.jsx
│   └── services/
│       └── foodApi.js
├── public/
│   └── sw.js
├── .env                    (Add this!)
├── .env.example            (UPDATED)
├── vercel.json             (NEW)
├── BACKEND_SETUP.md        (NEW)
├── package.json            (UPDATED)
├── index.html              (UPDATED)
└── vite.config.js
```

---

## Need Help?

📖 Read `BACKEND_SETUP.md` for comprehensive documentation
🐛 Check browser console for frontend errors
📝 Check terminal for backend errors
🔍 Verify `.env` file has all required variables

You're all set! 🚀
