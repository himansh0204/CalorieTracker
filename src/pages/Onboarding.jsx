import { useState } from 'react'
import styles from './Onboarding.module.css'
import { useToast } from '../context/ToastContext'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary', desc: 'desk job, little or no exercise' },
  { value: 'light', label: 'Light', desc: '1–3 days/week' },
  { value: 'moderate', label: 'Moderate', desc: '3–5 days/week' },
  { value: 'active', label: 'Active', desc: '6–7 days/week' },
  { value: 'very_active', label: 'Very Active', desc: 'athlete / physical job' },
]

const MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

function calcGoals({ gender, age, weightKg, heightCm, activityLevel, goalWeightKg }) {
  const w = parseFloat(weightKg)
  const h = parseFloat(heightCm)
  const a = parseInt(age)
  const bmr = gender === 'male'
    ? 10 * w + 6.25 * h - 5 * a + 5
    : 10 * w + 6.25 * h - 5 * a - 161
  const tdee = bmr * (MULTIPLIERS[activityLevel] || 1.55)
  const gw = goalWeightKg ? parseFloat(goalWeightKg) : null

  let calorieGoal
  if (gw && gw < w) calorieGoal = Math.round(tdee - 500)
  else if (gw && gw > w + 2) calorieGoal = Math.round(tdee + 300)
  else calorieGoal = Math.round(tdee)
  calorieGoal = Math.max(1200, calorieGoal)

  const proteinGoal = Math.round(w * 1.8)
  const fatGoal = Math.round((calorieGoal * 0.25) / 9)
  const carbsGoal = Math.max(50, Math.round((calorieGoal - proteinGoal * 4 - fatGoal * 9) / 4))
  return { calorieGoal, proteinGoal, carbsGoal, fatGoal }
}

export default function Onboarding({ onComplete, onCancel, mode = 'setup' }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    gender: '',
    age: '',
    heightCm: '',
    weightKg: '',
    goalWeightKg: '',
    activityLevel: 'moderate',
  })
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()
  const [error, setError] = useState(null)

  const goals = step === 4 && form.gender && form.age && form.weightKg && form.heightCm
    ? calcGoals(form)
    : null

  const BOUNDS = { age: [1, 120], heightCm: [50, 272], weightKg: [10, 500], goalWeightKg: [10, 500] }
  function set(key, val) {
    if (BOUNDS[key] && val !== '') {
      const n = Number(val)
      if (isNaN(n) || n < 0) return
      if (n > BOUNDS[key][1]) return
    }
    setForm((f) => ({ ...f, [key]: val }))
  }

  function canProceed() {
    if (step === 1) return form.gender && form.age
    if (step === 2) return form.heightCm && form.weightKg
    return true
  }

  function handleNext() {
    if (step === 1) {
      if (!form.gender) { showToast('Please select a gender', { type: 'error' }); return }
      const age = Number(form.age)
      if (!form.age || age < 1 || age > 120) { showToast('Please enter a valid age (1–120)', { type: 'error' }); return }
    }
    if (step === 2) {
      const h = Number(form.heightCm), w = Number(form.weightKg)
      if (!form.heightCm || h < 50 || h > 272) { showToast('Please enter a valid height (50–272 cm)', { type: 'error' }); return }
      if (!form.weightKg || w < 10 || w > 500) { showToast('Please enter a valid weight (10–500 kg)', { type: 'error' }); return }
      if (form.goalWeightKg) {
        const gw = Number(form.goalWeightKg)
        if (gw < 10 || gw > 500) { showToast('Please enter a valid goal weight (10–500 kg)', { type: 'error' }); return }
      }
    }
    setStep((s) => s + 1)
  }

  async function handleConfirm() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/settings/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          gender: form.gender,
          age: parseInt(form.age),
          weightKg: parseFloat(form.weightKg),
          heightCm: parseFloat(form.heightCm),
          activityLevel: form.activityLevel,
          goalWeightKg: form.goalWeightKg ? parseFloat(form.goalWeightKg) : null,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      onComplete()
    } catch (e) {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        {/* Close button — only in update mode */}
        {onCancel && (
          <button type="button" className={styles.closeBtn} onClick={onCancel}>✕</button>
        )}

        {/* Progress bar */}
        <div className={styles.progressBar}>
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`${styles.progressDot} ${s <= step ? styles.progressDotActive : ''}`}
            />
          ))}
        </div>
        <p className={styles.stepLabel}>Step {step} of 4</p>

        {step === 1 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>About You</h2>
            <p className={styles.stepSub}>Help us personalize your calorie goals</p>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Gender</label>
              <div className={styles.pillRow}>
                {['male', 'female'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={`${styles.pill} ${form.gender === g ? styles.pillActive : ''}`}
                    onClick={() => set('gender', g)}
                  >
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Age</label>
              <input
                type="number"
                min="10"
                max="120"
                placeholder="e.g. 28"
                value={form.age}
                onChange={(e) => set('age', e.target.value)}
                className={styles.input}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Your Body</h2>
            <p className={styles.stepSub}>We use this to calculate your metabolism</p>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Height (cm)</label>
              <input
                type="number"
                min="100"
                max="250"
                placeholder="e.g. 175"
                value={form.heightCm}
                onChange={(e) => set('heightCm', e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Current Weight (kg)</label>
              <input
                type="number"
                min="30"
                max="300"
                step="0.1"
                placeholder="e.g. 75.0"
                value={form.weightKg}
                onChange={(e) => set('weightKg', e.target.value)}
                className={styles.input}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Your Goal</h2>
            <p className={styles.stepSub}>Optional — leave blank to maintain current weight</p>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Goal Weight (kg)</label>
              <input
                type="number"
                min="30"
                max="300"
                step="0.1"
                placeholder="e.g. 70.0 (optional)"
                value={form.goalWeightKg}
                onChange={(e) => set('goalWeightKg', e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Activity Level</label>
              <div className={styles.activityList}>
                {ACTIVITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.activityOption} ${form.activityLevel === opt.value ? styles.activityOptionActive : ''}`}
                    onClick={() => set('activityLevel', opt.value)}
                  >
                    <span className={styles.activityLabel}>{opt.label}</span>
                    <span className={styles.activityDesc}>{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Your Plan</h2>
            <p className={styles.stepSub}>Here are your personalized daily goals</p>

            {goals && (
              <>
                <div className={styles.calorieHero}>
                  <span className={styles.fireIcon}>🔥</span>
                  <span className={styles.calorieNum}>{goals.calorieGoal}</span>
                  <span className={styles.calorieUnit}>kcal / day</span>
                </div>

                <div className={styles.macroGrid}>
                  <div className={styles.macroCard}>
                    <span className={styles.macroVal}>{goals.proteinGoal}g</span>
                    <span className={styles.macroLabel}>Protein</span>
                  </div>
                  <div className={styles.macroCard}>
                    <span className={styles.macroVal}>{goals.carbsGoal}g</span>
                    <span className={styles.macroLabel}>Carbs</span>
                  </div>
                  <div className={styles.macroCard}>
                    <span className={styles.macroVal}>{goals.fatGoal}g</span>
                    <span className={styles.macroLabel}>Fat</span>
                  </div>
                </div>
              </>
            )}

            {error && <p className={styles.errorMsg}>{error}</p>}
          </div>
        )}

        {/* Nav buttons */}
        <div className={styles.navRow}>
          {step > 1 && (
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => setStep((s) => s - 1)}
              disabled={submitting}
            >
              Back
            </button>
          )}

          {step < 4 && (
            <button
              type="button"
              className={styles.nextBtn}
              onClick={handleNext}
            >
              Next
            </button>
          )}

          {step === 4 && (
            <button
              type="button"
              className={styles.nextBtn}
              onClick={handleConfirm}
              disabled={submitting}
            >
              {submitting ? 'Saving…' : mode === 'update' ? 'Save Changes' : 'Start Tracking'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
