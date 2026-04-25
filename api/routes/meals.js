import express from 'express'
import Groq from 'groq-sdk'
import { query } from '../lib/db.js'
import { verifyToken } from '../middleware/auth.js'
import { checkLimit, imageAnalysisLimiter, mealLogLimiter } from '../lib/ratelimit.js'

const router = express.Router()
let _groq = null
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return _groq
}

// Log a meal
router.post('/', verifyToken, async (req, res) => {
  try {
    const userId = req.userId

    if (!await checkLimit(mealLogLimiter, String(userId))) {
      return res.status(429).json({ error: 'Too many requests. Please slow down.' })
    }

    const { foodName, calories, protein, carbs, fat, servingSize, foodId } = req.body

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

    sql += ` ORDER BY logged_at DESC LIMIT 200`

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

// Update a meal
router.put('/:mealId', verifyToken, async (req, res) => {
  try {
    const userId = req.userId
    const { mealId } = req.params

    if (!/^\d+$/.test(mealId)) {
      return res.status(400).json({ error: 'Invalid meal ID' })
    }
    const { foodName, calories, protein, carbs, fat } = req.body

    if (!foodName || typeof foodName !== 'string' || !foodName.trim()) {
      return res.status(400).json({ error: 'foodName is required' })
    }
    if (calories === undefined || isNaN(Number(calories)) || Number(calories) < 0) {
      return res.status(400).json({ error: 'calories must be a non-negative number' })
    }

    const result = await query(
      `UPDATE meals
       SET food_name = $1, calories = $2, protein = $3, carbs = $4, fat = $5
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [foodName, calories, protein || 0, carbs || 0, fat || 0, mealId, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meal not found' })
    }

    res.json({ ok: true, meal: result.rows[0] })
  } catch (error) {
    console.error('Update meal error:', error)
    res.status(500).json({ error: 'Failed to update meal' })
  }
})

// Delete a meal
router.delete('/:mealId', verifyToken, async (req, res) => {
  try {
    const userId = req.userId
    const { mealId } = req.params

    if (!/^\d+$/.test(mealId)) {
      return res.status(400).json({ error: 'Invalid meal ID' })
    }

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

// Analyze a meal photo with Groq Vision
router.post('/analyze-image', verifyToken, async (req, res) => {
  try {
    if (!await checkLimit(imageAnalysisLimiter, String(req.userId))) {
      return res.status(429).json({ error: 'Too many requests. Please wait before analyzing another image.' })
    }

    const { imageBase64 } = req.body
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' })
    }

    // ~10MB limit: base64 encodes 3 bytes → 4 chars, so 10MB ≈ 13.6M chars
    // Frontend compresses to ~1-2MB so this is a safety net only
    if (typeof imageBase64 !== 'string' || imageBase64.length > 14_000_000) {
      return res.status(413).json({ error: 'Image too large. Maximum size is 10MB.' })
    }

    if (!imageBase64.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image format' })
    }

    const response = await getGroq().chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageBase64 },
            },
            {
              type: 'text',
              text: `Analyze this meal photo and estimate the nutritional content for what is visible.
Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{
  "foodName": "descriptive meal name",
  "description": "brief 1-sentence description",
  "calories": <number>,
  "protein": <number in grams>,
  "carbs": <number in grams>,
  "fat": <number in grams>,
  "servingSize": "1 serving"
}
Use realistic estimates based on typical portion sizes. All nutrient values must be numbers.`,
            },
          ],
        },
      ],
    })

    const content = response.choices[0]?.message?.content?.trim()
    if (!content) {
      return res.status(502).json({ error: 'No response from AI' })
    }

    let parsed
    try {
      parsed = JSON.parse(content)
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return res.status(502).json({ error: 'Could not parse AI response' })
      }
      parsed = JSON.parse(jsonMatch[0])
    }

    res.json({
      ok: true,
      foodName: parsed.foodName || 'Unknown meal',
      description: parsed.description || '',
      calories: Math.round(Number(parsed.calories) || 0),
      protein: Math.round(Number(parsed.protein) || 0),
      carbs: Math.round(Number(parsed.carbs) || 0),
      fat: Math.round(Number(parsed.fat) || 0),
      servingSize: parsed.servingSize || '1 serving',
    })
  } catch (error) {
    console.error('Image analysis error:', error)
    res.status(500).json({ error: 'Failed to analyze image' })
  }
})

export default router
