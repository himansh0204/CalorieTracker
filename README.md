# CalTrack — Calorie Tracker App

A mobile-first PWA for tracking daily calories and macros, built with React + Vite + Firebase.

## Features

- 🔐 Google Sign-in via Firebase Auth
- 📊 Daily calorie & macro progress (protein, carbs, fat)
- 🔍 Food search powered by Open Food Facts (2M+ products, no API key needed)
- 📷 Barcode scanner via device camera
- 📅 30-day meal history
- ⚙️ Customizable daily goals
- 📱 Installable PWA (works offline, add to home screen)

## Setup

### 1. Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Create project**
2. Add a **Web app** → copy the config values
3. Enable **Authentication** → Sign-in method → **Google**
4. Enable **Firestore Database** → Start in production mode
5. In Firestore → **Rules** tab, paste the contents of `firestore.rules`

### 2. Environment Variables

```bash
cp .env.example .env
```

Open `.env` and fill in your Firebase config values:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser (or phone on the same Wi-Fi).

### 4. Build & Deploy

```bash
npm run build
```

Deploy the `dist/` folder to any static host:
- **Firebase Hosting**: `firebase deploy --only hosting`
- **Vercel**: `vercel --prod`
- **Netlify**: Drag & drop the `dist/` folder

## Project Structure

```
src/
├── context/
│   ├── AuthContext.jsx       # Google auth state
│   └── FoodLogContext.jsx    # Today's meals state
├── hooks/
│   └── useSettings.js        # Daily goal settings
├── pages/
│   ├── Login.jsx             # Google sign-in screen
│   ├── Dashboard.jsx         # Home — rings + meal list
│   ├── Log.jsx               # Food search + add meal
│   ├── Scanner.jsx           # Barcode camera scanner
│   ├── History.jsx           # 30-day history
│   └── Settings.jsx          # Goal editor + sign out
├── components/
│   ├── Layout.jsx            # Shell + bottom nav
│   ├── MacroRing.jsx         # SVG macro progress ring
│   └── MealCard.jsx          # Single meal row
└── services/
    ├── firebase.js           # Firebase init
    ├── firestoreService.js   # Firestore CRUD helpers
    └── foodApi.js            # Open Food Facts API
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React 18 + Vite |
| Auth + DB | Firebase Auth + Firestore |
| Food data | Open Food Facts API |
| Barcode scan | @zxing/library |
| Routing | React Router v6 |
| Styling | CSS Modules |
| PWA | Custom service worker + manifest |
