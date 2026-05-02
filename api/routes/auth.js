import express from 'express'
import { OAuth2Client } from 'google-auth-library'
import { query } from '../lib/db.js'
import { generateToken, verifyToken, cookieOptions } from '../middleware/auth.js'
import { checkLimit, authLimiter, accountDeletionLimiter } from '../lib/ratelimit.js'

const router = express.Router()
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

router.post('/google', async (req, res) => {
  try {
    const ip = req.ip || 'unknown'
    if (!await checkLimit(authLimiter, `ip:${ip}`)) {
      return res.status(429).json({ error: 'Too many login attempts. Please try again later.' })
    }

    const { idToken } = req.body

    if (!idToken) {
      return res.status(400).json({ error: 'idToken required' })
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    const googleId = payload.sub
    const email = payload.email
    const name = payload.name
    const picture = payload.picture

    let userRes = await query('SELECT id FROM users WHERE google_id = $1', [googleId])

    let userId
    if (userRes.rows.length === 0) {
      const insertRes = await query(
        'INSERT INTO users (google_id, email, name, picture) VALUES ($1, $2, $3, $4) RETURNING id',
        [googleId, email, name, picture]
      )
      userId = insertRes.rows[0].id
    } else {
      userId = userRes.rows[0].id
      await query(
        'UPDATE users SET picture = $1, name = $2, updated_at = NOW() WHERE id = $3',
        [picture, name, userId]
      )
    }

    const token = generateToken(userId, googleId)
    res.cookie('authToken', token, cookieOptions())

    res.json({
      ok: true,
      user: { id: userId, email, name, picture },
    })
  } catch (error) {
    console.error('Auth error:', error)
    res.status(401).json({ error: 'Authentication failed' })
  }
})

router.get('/me', verifyToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, name, picture FROM users WHERE id = $1',
      [req.userId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json({ ok: true, user: result.rows[0] })
  } catch (error) {
    console.error('Auth me error:', error)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

router.post('/logout', (_req, res) => {
  res.clearCookie('authToken', { ...cookieOptions(), maxAge: 0 })
  res.json({ ok: true })
})

router.delete('/account', verifyToken, async (req, res) => {
  try {
    const userId = req.userId
    if (!await checkLimit(accountDeletionLimiter, String(userId))) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' })
    }
    // GDPR audit record — persisted in a separate table or log before data is wiped
    await query(
      `INSERT INTO analytics_events (user_id, event_type, event_data)
       VALUES ($1, 'account_deleted', $2)`,
      [userId, JSON.stringify({ deletedAt: new Date().toISOString(), ip: req.ip })]
    )
    await query('DELETE FROM analytics_events WHERE user_id = $1 AND event_type != $2', [userId, 'account_deleted'])
    await query('DELETE FROM meals WHERE user_id = $1', [userId])
    await query('DELETE FROM user_settings WHERE user_id = $1', [userId])
    await query('DELETE FROM users WHERE id = $1', [userId])
    res.clearCookie('authToken', { ...cookieOptions(), maxAge: 0 })
    res.json({ ok: true })
  } catch (error) {
    console.error('Delete account error:', error)
    res.status(500).json({ error: 'Failed to delete account' })
  }
})

export default router
