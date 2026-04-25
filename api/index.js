import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'

import authRoutes from './routes/auth.js'
import mealsRoutes from './routes/meals.js'
import settingsRoutes from './routes/settings.js'
import analyticsRoutes from './routes/analytics.js'

const app = express()

// Middleware
app.use(helmet())
app.use(cookieParser())
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (origin.startsWith('http://localhost:')) return callback(null, true)
    if (origin.endsWith('.vercel.app')) return callback(null, true)
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return callback(null, true)
    return callback(Object.assign(new Error('Not allowed by CORS'), { status: 403 }))
  },
  credentials: true,
}))

app.use(express.json({ limit: '15mb' }))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/meals', mealsRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/analytics', analyticsRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
})

// Global error handler
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} → ${status}`, {
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  })
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message,
  })
})

// Catch unhandled promise rejections so the process doesn't crash silently
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason)
})

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err)
  process.exit(1)
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app
