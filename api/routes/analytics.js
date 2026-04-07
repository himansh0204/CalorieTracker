import express from 'express'
import { query } from '../lib/db.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

// Get user analytics summary
router.get('/summary', verifyToken, async (req, res) => {
  try {
    const userId = req.userId

    // Total meals logged
    const mealsRes = await query(
      'SELECT COUNT(*) as total_meals FROM meals WHERE user_id = $1',
      [userId]
    )

    // Days with data
    const daysRes = await query(
      'SELECT COUNT(DISTINCT DATE(logged_at)) as days_logged FROM meals WHERE user_id = $1',
      [userId]
    )

    // Total calories
    const caloriesRes = await query(
      'SELECT COALESCE(SUM(calories), 0) as total_calories FROM meals WHERE user_id = $1',
      [userId]
    )

    // Today's totals
    const todayRes = await query(
      `SELECT 
        COALESCE(SUM(calories), 0) as calories,
        COALESCE(SUM(protein), 0) as protein,
        COALESCE(SUM(carbs), 0) as carbs,
        COALESCE(SUM(fat), 0) as fat
       FROM meals
       WHERE user_id = $1 AND DATE(logged_at) = CURRENT_DATE`,
      [userId]
    )

    // Goal adherence (last 7 days)
    const adherenceRes = await query(
      `SELECT 
        DATE(logged_at) as date,
        COALESCE(SUM(calories), 0) as calories
       FROM meals
       WHERE user_id = $1 AND logged_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(logged_at)
       ORDER BY DATE(logged_at) DESC`,
      [userId]
    )

    res.json({
      ok: true,
      summary: {
        totalMealsLogged: parseInt(mealsRes.rows[0].total_meals),
        daysLogged: parseInt(daysRes.rows[0].days_logged),
        totalCalories: parseInt(caloriesRes.rows[0].total_calories),
        todayTotals: {
          calories: Math.round(todayRes.rows[0].calories),
          protein: Math.round(todayRes.rows[0].protein),
          carbs: Math.round(todayRes.rows[0].carbs),
          fat: Math.round(todayRes.rows[0].fat),
        },
        last7Days: adherenceRes.rows,
      },
    })
  } catch (error) {
    console.error('Analytics error:', error)
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
})

// Track custom analytics event (for frontend to log actions)
router.post('/event', verifyToken, async (req, res) => {
  try {
    const userId = req.userId
    const { eventType, eventData } = req.body

    if (!eventType) {
      return res.status(400).json({ error: 'eventType required' })
    }

    await query(
      `INSERT INTO analytics_events (user_id, event_type, event_data)
       VALUES ($1, $2, $3)`,
      [userId, eventType, eventData ? JSON.stringify(eventData) : null]
    )

    res.json({ ok: true })
  } catch (error) {
    console.error('Event tracking error:', error)
    res.status(500).json({ error: 'Failed to track event' })
  }
})

export default router
