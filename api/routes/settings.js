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
      `SELECT calorie_goal, protein_goal, carbs_goal, fat_goal,
              weight_kg, height_cm, age, gender, activity_level, goal_weight_kg, has_onboarded
       FROM user_settings
       WHERE user_id = $1`,
      [userId]
    )

    if (result.rows.length === 0) {
      return res.json({
        ok: true,
        settings: {
          ...DEFAULTS,
          weightKg: null,
          heightCm: null,
          age: null,
          gender: null,
          activityLevel: 'moderate',
          goalWeightKg: null,
          hasOnboarded: false,
        },
      })
    }

    const s = result.rows[0]
    res.json({
      ok: true,
      settings: {
        calorieGoal: s.calorie_goal,
        proteinGoal: s.protein_goal,
        carbsGoal: s.carbs_goal,
        fatGoal: s.fat_goal,
        weightKg: s.weight_kg != null ? parseFloat(s.weight_kg) : null,
        heightCm: s.height_cm != null ? parseFloat(s.height_cm) : null,
        age: s.age,
        gender: s.gender,
        activityLevel: s.activity_level || 'moderate',
        goalWeightKg: s.goal_weight_kg != null ? parseFloat(s.goal_weight_kg) : null,
        hasOnboarded: s.has_onboarded || false,
      },
    })
  } catch (error) {
    console.error('Settings fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

// Update user settings (goals only)
router.post('/', verifyToken, async (req, res) => {
  try {
    const userId = req.userId
    const { calorieGoal, proteinGoal, carbsGoal, fatGoal } = req.body

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

// Onboarding — calculate goals from body stats and save everything
router.post('/onboarding', verifyToken, async (req, res) => {
  try {
    const userId = req.userId
    const { gender, age, weightKg, heightCm, activityLevel, goalWeightKg } = req.body

    const VALID_GENDERS = ['male', 'female']
    const VALID_ACTIVITY = ['sedentary', 'light', 'moderate', 'active', 'very_active']

    if (!VALID_GENDERS.includes(gender)) {
      return res.status(400).json({ error: 'gender must be male or female' })
    }
    if (!age || isNaN(Number(age)) || Number(age) < 10 || Number(age) > 120) {
      return res.status(400).json({ error: 'age must be a number between 10 and 120' })
    }
    if (!weightKg || isNaN(Number(weightKg)) || Number(weightKg) <= 0) {
      return res.status(400).json({ error: 'weightKg must be a positive number' })
    }
    if (!heightCm || isNaN(Number(heightCm)) || Number(heightCm) <= 0) {
      return res.status(400).json({ error: 'heightCm must be a positive number' })
    }
    if (!VALID_ACTIVITY.includes(activityLevel)) {
      return res.status(400).json({ error: `activityLevel must be one of: ${VALID_ACTIVITY.join(', ')}` })
    }

    // Mifflin-St Jeor BMR
    const bmr =
      gender === 'male'
        ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
        : 10 * weightKg + 6.25 * heightCm - 5 * age - 161

    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    }
    const tdee = bmr * (multipliers[activityLevel] || 1.55)

    let calorieGoal
    if (goalWeightKg && goalWeightKg < weightKg) {
      calorieGoal = Math.round(tdee - 500)
    } else if (goalWeightKg && goalWeightKg > weightKg + 2) {
      calorieGoal = Math.round(tdee + 300)
    } else {
      calorieGoal = Math.round(tdee)
    }
    calorieGoal = Math.max(1200, calorieGoal)

    const proteinGoal = Math.round(weightKg * 1.8)
    const fatGoal = Math.round((calorieGoal * 0.25) / 9)
    const carbsGoal = Math.max(50, Math.round((calorieGoal - proteinGoal * 4 - fatGoal * 9) / 4))

    const existRes = await query('SELECT id FROM user_settings WHERE user_id = $1', [userId])

    if (existRes.rows.length === 0) {
      await query(
        `INSERT INTO user_settings
           (user_id, calorie_goal, protein_goal, carbs_goal, fat_goal,
            weight_kg, height_cm, age, gender, activity_level, goal_weight_kg, has_onboarded, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,TRUE,NOW())`,
        [userId, calorieGoal, proteinGoal, carbsGoal, fatGoal, weightKg, heightCm, age, gender, activityLevel, goalWeightKg || null]
      )
    } else {
      await query(
        `UPDATE user_settings
         SET calorie_goal=$2, protein_goal=$3, carbs_goal=$4, fat_goal=$5,
             weight_kg=$6, height_cm=$7, age=$8, gender=$9, activity_level=$10,
             goal_weight_kg=$11, has_onboarded=TRUE, updated_at=NOW()
         WHERE user_id=$1`,
        [userId, calorieGoal, proteinGoal, carbsGoal, fatGoal, weightKg, heightCm, age, gender, activityLevel, goalWeightKg || null]
      )
    }

    res.json({ ok: true, goals: { calorieGoal, proteinGoal, carbsGoal, fatGoal } })
  } catch (error) {
    console.error('Onboarding error:', error)
    res.status(500).json({ error: 'Failed to save onboarding data' })
  }
})

export default router
