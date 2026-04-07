import express from 'express'
import Groq from 'groq-sdk'
import { query } from '../lib/db.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

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

    // Daily streak — consecutive days with at least one meal logged
    const streakDatesRes = await query(
      `SELECT DISTINCT DATE(logged_at) as meal_date
       FROM meals WHERE user_id = $1
       ORDER BY meal_date DESC`,
      [userId]
    )

    const dates = streakDatesRes.rows.map((r) => {
      const d = new Date(r.meal_date)
      return d.toISOString().slice(0, 10)
    })

    let streak = 0
    if (dates.length > 0) {
      const today = new Date().toISOString().slice(0, 10)
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      // Streak is active if the most recent logged day is today or yesterday
      if (dates[0] === today || dates[0] === yesterday) {
        let checkDate = dates[0]
        for (const date of dates) {
          if (date === checkDate) {
            streak++
            const d = new Date(checkDate)
            d.setDate(d.getDate() - 1)
            checkDate = d.toISOString().slice(0, 10)
          } else {
            break
          }
        }
      }
    }

    res.json({
      ok: true,
      summary: {
        totalMealsLogged: parseInt(mealsRes.rows[0].total_meals),
        daysLogged: parseInt(daysRes.rows[0].days_logged),
        totalCalories: parseInt(caloriesRes.rows[0].total_calories),
        streak,
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

// Generate weekly AI report
router.get('/weekly-report', verifyToken, async (req, res) => {
  try {
    const userId = req.userId

    // Last 7 days per-day totals + meal names
    const weekRes = await query(
      `SELECT
        DATE(logged_at) as date,
        COALESCE(SUM(calories), 0) as calories,
        COALESCE(SUM(protein), 0)  as protein,
        COALESCE(SUM(carbs), 0)    as carbs,
        COALESCE(SUM(fat), 0)      as fat,
        COUNT(*) as meal_count,
        STRING_AGG(food_name, ', ' ORDER BY logged_at) as meals
       FROM meals
       WHERE user_id = $1 AND logged_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(logged_at)
       ORDER BY date ASC`,
      [userId]
    )

    // User goals
    const settingsRes = await query(
      `SELECT calorie_goal, protein_goal, carbs_goal, fat_goal
       FROM user_settings WHERE user_id = $1`,
      [userId]
    )

    const goals = settingsRes.rows[0] || { calorie_goal: 2000, protein_goal: 150, carbs_goal: 200, fat_goal: 65 }
    const days = weekRes.rows

    if (days.length === 0) {
      return res.json({ ok: true, report: "No meals logged in the past 7 days. Start tracking your meals to get a personalised weekly report!" })
    }

    const avgCalories = Math.round(days.reduce((s, d) => s + Number(d.calories), 0) / days.length)
    const avgProtein  = Math.round(days.reduce((s, d) => s + Number(d.protein), 0)  / days.length)
    const avgCarbs    = Math.round(days.reduce((s, d) => s + Number(d.carbs), 0)    / days.length)
    const avgFat      = Math.round(days.reduce((s, d) => s + Number(d.fat), 0)      / days.length)

    const daysSummary = days.map((d) =>
      `${d.date}: ${Math.round(d.calories)} kcal | P:${Math.round(d.protein)}g C:${Math.round(d.carbs)}g F:${Math.round(d.fat)}g | Meals: ${d.meals}`
    ).join('\n')

    const prompt = `You are a friendly nutrition coach. Analyse the user's past 7 days of eating and write a concise weekly report.

USER GOALS: ${goals.calorie_goal} kcal/day | Protein ${goals.protein_goal}g | Carbs ${goals.carbs_goal}g | Fat ${goals.fat_goal}g

DAILY DATA:
${daysSummary}

WEEKLY AVERAGES: ${avgCalories} kcal | Protein ${avgProtein}g | Carbs ${avgCarbs}g | Fat ${avgFat}g
Days tracked: ${days.length}/7

Write the report in this exact structure (use these headings):
## Overview
2-3 sentences on overall calorie adherence and consistency.

## Highlights
2 positive things the user did well this week (bullet points).

## Areas to Improve
2 specific, actionable suggestions (bullet points).

## Macro Balance
One sentence each on protein, carbs, and fat intake vs goals.

## This Week's Focus
One clear, motivating goal for the coming week.

Keep the tone warm, encouraging, and specific. Total length: around 150-200 words.`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const report = completion.choices[0]?.message?.content?.trim() || 'Could not generate report.'

    res.json({ ok: true, report })
  } catch (error) {
    console.error('Weekly report error:', error)
    res.status(500).json({ error: 'Failed to generate report' })
  }
})

// Nutrition progress chart data
router.get('/progress', verifyToken, async (req, res) => {
  try {
    const userId = req.userId
    const period = req.query.period || 'week'

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let startDate, endDate

    function getMonday(d) {
      const day = d.getDay()
      const diff = (day === 0 ? -6 : 1 - day)
      const mon = new Date(d)
      mon.setDate(d.getDate() + diff)
      return mon
    }

    if (period === 'week') {
      startDate = getMonday(today)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
    } else if (period === 'last-week') {
      const thisMonday = getMonday(today)
      startDate = new Date(thisMonday)
      startDate.setDate(thisMonday.getDate() - 7)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
    } else if (period === '2weeks') {
      const thisMonday = getMonday(today)
      startDate = new Date(thisMonday)
      startDate.setDate(thisMonday.getDate() - 14)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
    } else {
      // month — current calendar month
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    }

    const toLocalDateStr = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const startStr = toLocalDateStr(startDate)
    const endStr = toLocalDateStr(endDate)

    const rows = await query(
      `SELECT TO_CHAR(DATE(logged_at), 'YYYY-MM-DD') as date,
        COALESCE(SUM(calories), 0) as calories,
        COALESCE(SUM(protein), 0) as protein,
        COALESCE(SUM(carbs), 0) as carbs,
        COALESCE(SUM(fat), 0) as fat
       FROM meals
       WHERE user_id = $1 AND DATE(logged_at) BETWEEN $2 AND $3
       GROUP BY DATE(logged_at)
       ORDER BY date ASC`,
      [userId, startStr, endStr]
    )

    const dataMap = {}
    for (const row of rows.rows) {
      dataMap[row.date] = row  // row.date is now always a 'YYYY-MM-DD' string
    }

    const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
    const days = []
    const cur = new Date(startDate)
    while (cur <= endDate) {
      const dateStr = toLocalDateStr(cur)
      const row = dataMap[dateStr]
      const dayIdx = (cur.getDay() + 6) % 7 // 0=Mon, 6=Sun
      const isWeekPeriod = period !== 'month'
      days.push({
        date: dateStr,
        label: isWeekPeriod ? DAY_LETTERS[dayIdx] : String(cur.getDate()),
        calories: row ? Math.round(parseFloat(row.calories)) : 0,
        protein: row ? Math.round(parseFloat(row.protein)) : 0,
        carbs: row ? Math.round(parseFloat(row.carbs)) : 0,
        fat: row ? Math.round(parseFloat(row.fat)) : 0,
      })
      cur.setDate(cur.getDate() + 1)
    }

    const totalCalories = days.reduce((s, d) => s + d.calories, 0)
    res.json({ ok: true, days, totalCalories, startDate: startStr, endDate: endStr })
  } catch (error) {
    console.error('Progress error:', error)
    res.status(500).json({ error: 'Failed to fetch progress data' })
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
