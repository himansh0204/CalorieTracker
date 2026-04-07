# CalorieTracker Backend Migration Guide

You've successfully migrated from **Firebase to a custom Node.js + PostgreSQL backend**. Here's everything you need to set up and deploy.

## Architecture

```
Frontend (React + Vite)
    ↓ (HTTP REST API)
Backend (Express.js on Vercel Functions)
    ↓ (SQL)
PostgreSQL Database
```

### What Changed

| Aspect | Firebase | Custom Backend |
|--------|----------|----------------|
| Auth | Firebase Auth | Google OAuth 2.0 + JWT |
| Database | Firestore | PostgreSQL |
| API | Firebase SDK | REST/JSON |
| Hosting | Firebase Hosting | Vercel (frontend + backend) |
| Analytics | Manual tracking | Dedicated `analytics_events` table |

---

## Quick Start (Local Development)

### Prerequisites

1. **Node.js 18+** (you have v20.20.2 ✓)
2. **PostgreSQL 12+** (local or via container)
3. **Google OAuth Credentials** (see setup below)

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable **Google+ API**
4. Go to **Credentials** → **Create OAuth 2.0 Client ID**
5. Choose **Web Application**
6. Add authorized redirect URIs:
   ```
   http://localhost:5173
   http://localhost:3000
   https://your-frontend.vercel.app
   ```
7. Copy your **Client ID** (looks like: `XXX.apps.googleusercontent.com`)

### Step 2: Update Environment Variables

Create (or update) `.env` in the project root:

```env
# Frontend (React)
VITE_API_URL=http://localhost:3001/api
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE

# Backend (Node.js)
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/calorietracker
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
FRONTEND_URL=http://localhost:5173
```

Replace:
- `YOUR_GOOGLE_CLIENT_ID_HERE` with your actual Google Client ID
- `password` with your PostgreSQL password
- `your-super-secret-jwt-key-min-32-chars` with a random string (e.g., use `openssl rand -base64 32`)

### Step 3: Set Up PostgreSQL Locally

#### Option A: Using Homebrew (macOS)

```bash
brew install postgresql
brew services start postgresql
createdb calorietracker
psql calorietracker -c "CREATE USER calorietracker WITH PASSWORD 'password';"
psql calorietracker -c "ALTER USER calorietracker WITH SUPERUSER;"
```

#### Option B: Using Docker

```bash
docker run --name postgres-caltrack \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=calorietracker \
  -p 5432:5432 \
  -d postgres:15
```

#### Option C: Cloud Database (Vercel Postgres / Neon)

We'll cover this in the deployment section.

### Step 4: Run Database Migrations

```bash
npm run db:migrate
```

This creates the schema:
- ✓ `users` table (Google OAuth)
- ✓ `user_settings` table (goals)
- ✓ `meals` table (food logs)
- ✓ `analytics_events` table (tracking)

### Step 5: Install Dependencies & Start Dev Server

```bash
npm install
npm run dev
```

This starts:
- **Frontend**: http://localhost:5173 (Vite)
- **Backend**: http://localhost:3001 (Express)

### Step 6: Test Login Flow

1. Open http://localhost:5173
2. Click "Continue with Google"
3. Select your Google account
4. Should redirect to Dashboard

If you see errors:
- Check browser console for CORS/auth errors
- Check terminal for backend logs
- Verify `DATABASE_URL` and `GOOGLE_CLIENT_ID` in `.env`

---

## API Endpoints

All requests require JWT token in header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Authentication

**POST `/api/auth/google`**
- Body: `{ idToken: "google-id-token" }`
- Response: `{ ok: true, token: "jwt", user: {...} }`

### Meals

**POST `/api/meals`** – Log a meal
```json
{
  "foodName": "Chicken Breast",
  "calories": 330,
  "protein": 62,
  "carbs": 0,
  "fat": 7,
  "servingSize": "100g",
  "foodId": "123456"
}
```

**GET `/api/meals?startDate=2025-01-20&endDate=2025-01-20`** – Fetch meals
- Query params: `startDate`, `endDate` (YYYY-MM-DD)
- Response: `{ ok: true, meals: [...] }`

**DELETE `/api/meals/:mealId`** – Delete meal
- Response: `{ ok: true }`

### Settings

**GET `/api/settings`** – Fetch user goals
- Response: `{ ok: true, settings: { calorieGoal, proteinGoal, ... } }`

**POST `/api/settings`** – Update goals
```json
{
  "calorieGoal": 2000,
  "proteinGoal": 150,
  "carbsGoal": 250,
  "fatGoal": 65
}
```

### Analytics

**GET `/api/analytics/summary`** – User stats
- Response:
```json
{
  "ok": true,
  "summary": {
    "totalMealsLogged": 42,
    "daysLogged": 30,
    "totalCalories": 60000,
    "todayTotals": { "calories": 1850, "protein": 120, ... },
    "last7Days": [{ "date": "2025-01-20", "calories": 1900 }, ...]
  }
}
```

**POST `/api/analytics/event`** – Track custom event
```json
{ "eventType": "meal_logged", "eventData": {...} }
```

---

## Deployment to Vercel

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Add custom backend"
git remote add origin https://github.com/YOUR_USERNAME/CalorieTracker.git
git push -u origin main
```

### Step 2: Create PostgreSQL Database

**Option A: Vercel Postgres** (easiest)
1. Go to [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
2. Create a new Postgres database in your Vercel project
3. Copy connection string

**Option B: Neon** (free tier)
1. Go to [Neon.tech](https://neon.tech)
2. Create account & database
3. Copy PostgreSQL connection string

**Option C: AWS RDS** (production)
- More expensive but fully managed

### Step 3: Deploy to Vercel

1. Import your GitHub repo into Vercel
2. Set environment variables in **Settings → Environment Variables**:
   ```
   VITE_API_URL=https://your-app.vercel.app/api
   VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID
   NODE_ENV=production
   DATABASE_URL=postgresql://...your-neon-or-vercel-postgres...
   JWT_SECRET=your-secret-min-32-chars
   GOOGLE_CLIENT_ID=YOUR_CLIENT_ID
   FRONTEND_URL=https://your-app.vercel.app
   ```

3. Click **Deploy**

### Step 4: Run Migrations on Production

After deployment, run migrations on your prod database:

```bash
set -a; source .env; set +a
node db/migrate.js
```

Or via Vercel CLI:

```bash
vercel env pull
node db/migrate.js
```

### Step 5: Update Google OAuth Redirect URI

In Google Cloud Console, add your Vercel URL:
```
https://your-app.vercel.app
```

---

## Project Structure

```
CalorieTracker/
├── src/                          # React frontend
│   ├── context/
│   │   ├── AuthContext.jsx      # ✓ Updated for JWT
│   │   └── FoodLogContext.jsx   # ✓ Updated for REST API
│   ├── hooks/
│   │   └── useSettings.js       # ✓ Updated for REST API
│   ├── pages/
│   │   ├── Login.jsx            # ✓ Updated for Google OAuth
│   │   ├── Dashboard.jsx
│   │   ├── Log.jsx
│   │   ├── Scanner.jsx
│   │   ├── Settings.jsx
│   │   └── History.jsx
│   ├── services/
│   │   └── foodApi.js           # Open Food Facts (unchanged)
│   └── main.jsx
├── api/                          # ✓ NEW: Express.js backend
│   ├── index.js                 # Express server
│   ├── lib/
│   │   └── db.js                # PostgreSQL connection pool
│   ├── middleware/
│   │   └── auth.js              # JWT verification
│   └── routes/
│       ├── auth.js              # Google OAuth + JWT
│       ├── meals.js             # Meal CRUD
│       ├── settings.js          # Goals CRUD
│       └── analytics.js         # Analytics endpoints
├── db/                           # ✓ NEW: Database
│   ├── schema.sql               # PostgreSQL schema
│   └── migrate.js               # Migration runner
├── public/
│   └── sw.js                    # Service worker
├── vercel.json                  # ✓ NEW: Vercel config
├── .env.example                 # ✓ Updated
├── .env                         # Your actual secrets (gitignore'd)
├── package.json                 # ✓ Updated with backend deps
└── vite.config.js
```

---

## Analytics

The system automatically tracks these events in `analytics_events` table:

- `meal_logged` – When user logs a meal
- `meal_deleted` – When user deletes a meal
- `settings_updated` – When user updates goals
- Custom events via `/api/analytics/event`

You can query analytics:

```sql
-- Meals logged per user (last 30 days)
SELECT user_id, COUNT(*) as meals FROM analytics_events
WHERE event_type = 'meal_logged' AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY user_id;

-- Daily active users
SELECT DATE(created_at) as date, COUNT(DISTINCT user_id) as active_users
FROM analytics_events
GROUP BY DATE(created_at)
ORDER BY date DESC LIMIT 30;
```

---

## Troubleshooting

### CORS Errors

**Problem**: `Access to XMLHttpRequest blocked by CORS`

**Solution**: Check `api/index.js` CORS whitelist includes your frontend URL:
```javascript
origin: [
  'http://localhost:5173',
  'https://your-app.vercel.app',
]
```

### 401 Unauthorized

**Problem**: API returns 401 on requests

**Solution**:
1. Check JWT token is in localStorage: `localStorage.getItem('authToken')`
2. Verify token is sent in header: `Authorization: Bearer <token>`
3. Check JWT_SECRET matches between frontend and backend

### Database Connection Failed

**Problem**: `Error: connect ECONNREFUSED`

**Solution**:
1. Start PostgreSQL: `brew services start postgresql` (or Docker)
2. Verify `DATABASE_URL` in `.env`
3. Test connection: `psql $DATABASE_URL`

### Migrations Failed

**Problem**: `relation "users" already exists`

**Solution**: Schema already created. This is fine.

---

## Next Steps

1. ✅ **Keep existing frontend code** – No major UI changes needed
2. ✅ **Settings pass user.id instead of user.uid** – Already updated in hooks
3. 🚀 **Deploy to Vercel** – Full production setup
4. 📊 **Use analytics** – Query `analytics_events` for insights
5. 🤖 **Add OpenAI later** – Backend now supports Cloud Functions

---

## Support

- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Express.js Guide**: https://expressjs.com/
- **Vercel Postgres**: https://vercel.com/docs/storage/vercel-postgres
- **Google OAuth**: https://developers.google.com/identity/protocols/oauth2/web-server-flow

Happy tracking! 🥗
