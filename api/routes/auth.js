import express from 'express'
import { OAuth2Client } from 'google-auth-library'
import { query } from '../lib/db.js'
import { generateToken } from '../middleware/auth.js'

const router = express.Router()
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body

    if (!idToken) {
      return res.status(400).json({ error: 'idToken required' })
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    const googleId = payload.sub
    const email = payload.email
    const name = payload.name
    const picture = payload.picture

    // Check if user exists, if not create
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
      // Update picture/name in case they changed
      await query(
        'UPDATE users SET picture = $1, name = $2, updated_at = NOW() WHERE id = $3',
        [picture, name, userId]
      )
    }

    // Generate JWT
    const token = generateToken(userId, googleId)

    res.json({
      ok: true,
      token,
      user: { id: userId, email, name, picture },
    })
  } catch (error) {
    console.error('Auth error:', error)
    res.status(401).json({ error: 'Authentication failed' })
  }
})

export default router
