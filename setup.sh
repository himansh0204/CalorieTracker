#!/bin/bash

# CalorieTracker Backend Setup Script
# This script helps you configure your local development environment

set -e

echo "🚀 CalorieTracker Backend Setup"
echo "======================================"
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "⚠️  .env already exists. Skipping creation."
    echo ""
else
    echo "📝 Creating .env file..."
    echo ""
    
    # Prompt for Google Client ID
    read -p "📱 Enter your Google OAuth Client ID: " GOOGLE_CLIENT_ID
    if [ -z "$GOOGLE_CLIENT_ID" ]; then
        echo "❌ Google Client ID is required. Get it from https://console.cloud.google.com"
        exit 1
    fi
    
    # Generate JWT Secret
    JWT_SECRET=$(openssl rand -base64 32)
    
    # Create .env file
    cat > .env << EOF
# Frontend (React/Vite)
VITE_API_URL=http://localhost:3001/api
VITE_GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID

# Backend (Node.js/Express)
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://calorietracker:password@localhost:5432/calorietracker
JWT_SECRET=$JWT_SECRET
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
FRONTEND_URL=http://localhost:5173
EOF
    
    echo "✅ .env file created!"
    echo ""
    echo "⚠️  UPDATE these values in .env if different:"
    echo "   - Database password (currently: 'password')"
    echo "   - Database name (currently: 'calorietracker')"
    echo ""
fi

# Check if Node modules are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed!"
    echo ""
fi

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    if psql -c "SELECT 1" &> /dev/null; then
        echo "✅ PostgreSQL is running"
        echo ""
    else
        echo "⚠️  PostgreSQL might not be running. Start with:"
        echo "   brew services start postgresql"
        echo ""
    fi
else
    echo "⚠️  PostgreSQL not found. Install with:"
    echo "   brew install postgresql"
    echo ""
fi

# Run migrations
echo "🗄️  Running database migrations..."
npm run db:migrate || echo "⚠️  Migration failed. Check DATABASE_URL in .env"
echo ""

echo "======================================"
echo "✅ Setup complete!"
echo ""
echo "📖 Next steps:"
echo "   1. Start dev server: npm run dev"
echo "   2. Open: http://localhost:5173"
echo "   3. Click 'Continue with Google'"
echo ""
echo "📚 For more info, read BACKEND_SETUP.md"
