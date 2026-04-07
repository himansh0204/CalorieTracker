import express from 'express'
import { query } from '../lib/db.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

// Log a meal
router.post('/', verifyToken, async (req, res) => {
  try {
    const { foodName, calories, protein, carbs, fat, servingSize, foodId } = req.body
    const userId = req.userId

    if (!foodName || calories === undefined) {
      return res.status(400).json({ error: 'foodName and calories required' })
    }

    const result = await query(
      `INSERT INTO meals (user_id, food_name, calories, protein, carbs, fat, serving_size, food_id, logged_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, logged_at`,
      [userId, foodName, calories, protein || 0, carbs || 0, fat || 0, servingSize || '1 serving', foodId]
    )

    // Track analytics event
    await query(
      `INSERT INTO analytics_events (user_id, event_type, event_data)
       VALUES ($1, 'meal_logged', $2)`,
      [userId, JSON.stringify({ calories, foodName })]
    )

    res.status(201).json({
      ok: true,
      mealId: result.rows[0].id,
      loggedAt: result.rows[0].logged_at,
    })
  } catch (error) {
    console.error('Meal logging error:', error)
    res.status(500).json({ error: 'Failed to log meal' })
  }
})

// Get meals for a date range
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.userId
    const { startDate, endDate } = req.query

    let sql = 'SELECT * FROM meals WHERE user_id = $1'
    const params = [userId]

    if (startDate) {
      sql += ` AND DATE(logged_at) >= $${params.length + 1}`
      params.push(startDate)
    }

    if (endDate) {
      sql += ` AND DATE(logged_at) <= $${params.length + 1}`
      params.push(endDate)
    }

    sql += ' ORDER BY logged_at DESC'

    const result = await query(sql, params)

    res.json({
      ok: true,
      meals: result.rows,
    })
  } catch (error) {
    console.error('Fetch meals error:', error)
    res.status(500).json({ error: 'Failed to fetch meals' })
  }
})

// Delete a meal
router.delete('/:mealId', verifyToken, async (req, res) => {
  try {
    const userId = req.userId
    const { mealId } = req.params

    const result = await query(
      'DELETE FROM meals WHERE id = $1 AND user_id = $2 RETURNING id',
      [mealId, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meal not found' })
    }

    await query(
      `INSERT INTO analytics_events (user_id, event_type, event_data)
       VALUES ($1, 'meal_deleted', $2)`,
      [userId, JSON.stringify({ mealId })]
    )

    res.json({ ok: true })
  } catch (error) {
    console.error('Delete meal error:', error)
    res.status(500).json({ error: 'Failed to delete meal' })
  }
})

export default router
