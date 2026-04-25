export const ACTIVITY_OPTIONS = [
  { value: 'sedentary',   label: 'Sedentary',  desc: 'desk job, little or no exercise' },
  { value: 'light',       label: 'Light',       desc: '1–3 days/week' },
  { value: 'moderate',    label: 'Moderate',    desc: '3–5 days/week' },
  { value: 'active',      label: 'Active',      desc: '6–7 days/week' },
  { value: 'very_active', label: 'Very Active', desc: 'athlete / physical job' },
]

export const MULTIPLIERS = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
}

export const ACTIVITY_LABELS = {
  sedentary: 'Sedentary', light: 'Light', moderate: 'Moderate',
  active: 'Active', very_active: 'Very Active',
}

export function calcGoals({ gender, age, weightKg, heightCm, activityLevel, goalWeightKg }) {
  const w = parseFloat(weightKg), h = parseFloat(heightCm), a = parseInt(age)
  if (!w || !h || !a) return null
  const bmr = gender === 'male' ? 10*w + 6.25*h - 5*a + 5 : 10*w + 6.25*h - 5*a - 161
  const tdee = bmr * (MULTIPLIERS[activityLevel] || 1.55)
  const gw = goalWeightKg ? parseFloat(goalWeightKg) : null
  let calorieGoal = gw && gw < w ? Math.round(tdee - 500) : gw && gw > w + 2 ? Math.round(tdee + 300) : Math.round(tdee)
  calorieGoal = Math.max(1200, calorieGoal)
  const proteinGoal = Math.round(w * 1.8)
  const fatGoal = Math.round((calorieGoal * 0.25) / 9)
  const carbsGoal = Math.max(50, Math.round((calorieGoal - proteinGoal * 4 - fatGoal * 9) / 4))
  return { calorieGoal, proteinGoal, carbsGoal, fatGoal }
}
