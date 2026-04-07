import express from 'express'
import { query } from '../lib/db.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

const DEFAULTS = {
  calorieGoal: 2000,
  proteinGoal: 150,
  carbsGoal: 250,
  fatGoal: 65,
}

// Get user settings
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.userId

    const result = await query(
      `SELECT calorie_goal, protein_goal, carbs_goal, fat_goal
       FROM user_settings
       WHERE user_id = $1`,
      [userId]
    )

    if (result.rows.length === 0) {
      return res.json({ ok: true, settings: DEFAULTS })
    }

    const settings = result.rows[0]
    res.json({
      ok: true,
      settings: {
        calorieGoal: settings.calorie_goal,
        proteinGoal: settings.protein_goal,
        carbsGoal: settings.carbs_goal,
        fatGoal: settings.fat_goal,
      },
    })
  } catch (error) {
    console.error('Settings fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

// Update user settings
router.post('/', verifyToken, async (req, res) => {
  try {
    const userId = req.userId
    const { calorieGoal, proteinGoal, carbsGoal, fatGoal } = req.body

    // Check if settings exist
    const existRes = await query('SELECT id FROM user_settings WHERE user_id = $1', [userId])

    if (existRes.rows.length === 0) {
      await query(
        `INSERT INTO user_settings (user_id, calorie_goal, protein_goal, carbs_goal, fat_goal, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [userId, calorieGoal || DEFAULTS.calorieGoal, proteinGoal || DEFAULTS.proteinGoal, carbsGoal || DEFAULTS.carbsGoal, fatGoal || DEFAULTS.fatGoal]
      )
    } else {
      await query(
        `UPDATE user_settings
         SET calorie_goal = $2, protein_goal = $3, carbs_goal = $4, fat_goal = $5, updated_at = NOW()
         WHERE user_id = $1`,
        [userId, calorieGoal || DEFAULTS.calorieGoal, proteinGoal || DEFAULTS.proteinGoal, carbsGoal || DEFAULTS.carbsGoal, fatGoal || DEFAULTS.fatGoal]
      )
    }

    await query(
      `INSERT INTO analytics_events (user_id, event_type, event_data)
       VALUES ($1, 'settings_updated', $2)`,
      [userId, JSON.stringify({ calorieGoal, proteinGoal, carbsGoal, fatGoal })]
    )

    res.json({ ok: true })
  } catch (error) {
    console.error('Settings update error:', error)
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

export default router
