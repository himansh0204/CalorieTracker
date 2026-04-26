import { useState } from 'react'
import Sheet from './Sheet'
import sheetStyles from './Sheet.module.css'
import styles from './BodyStatsSheet.module.css'
import { ACTIVITY_OPTIONS, calcGoals } from './settingsConstants'
import { useToast } from '../../context/ToastContext'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export default function BodyStatsSheet({ settings, onClose, onSaved }) {
  const [form, setForm] = useState({
    gender:        settings.gender        || '',
    age:           settings.age           ? String(settings.age)          : '',
    heightCm:      settings.heightCm      ? String(settings.heightCm)     : '',
    weightKg:      settings.weightKg      ? String(settings.weightKg)     : '',
    goalWeightKg:  settings.goalWeightKg  ? String(settings.goalWeightKg) : '',
    activityLevel: settings.activityLevel || 'moderate',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)
  const { showToast } = useToast()

  const goals   = calcGoals(form)
  const canSave = form.gender && form.age && form.heightCm && form.weightKg

  const BOUNDS = { age: [1, 120], heightCm: [50, 272], weightKg: [10, 500], goalWeightKg: [10, 500] }
  function set(key, val) {
    if (BOUNDS[key] && val !== '') {
      const n = Number(val)
      if (isNaN(n) || n < 0) return
      if (n > BOUNDS[key][1]) return
    }
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSave() {
    if (!form.gender) { showToast('Please select a gender', { type: 'error' }); return }
    const age = Number(form.age), h = Number(form.heightCm), w = Number(form.weightKg)
    if (!form.age || age < 1 || age > 120) { showToast('Please enter a valid age (1–120)', { type: 'error' }); return }
    if (!form.heightCm || h < 50 || h > 272) { showToast('Please enter a valid height (50–272 cm)', { type: 'error' }); return }
    if (!form.weightKg || w < 10 || w > 500) { showToast('Please enter a valid weight (10–500 kg)', { type: 'error' }); return }
    if (form.goalWeightKg) {
      const gw = Number(form.goalWeightKg)
      if (gw < 10 || gw > 500) { showToast('Please enter a valid goal weight (10–500 kg)', { type: 'error' }); return }
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/settings/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          gender:        form.gender,
          age:           parseInt(form.age),
          weightKg:      parseFloat(form.weightKg),
          heightCm:      parseFloat(form.heightCm),
          activityLevel: form.activityLevel,
          goalWeightKg:  form.goalWeightKg ? parseFloat(form.goalWeightKg) : null,
        }),
      })
      if (!res.ok) throw new Error()
      await onSaved()
      onClose()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet onClose={onClose} title="Body Stats & Goals">
      <div className={sheetStyles.pad}>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Gender</label>
          <div className={styles.pillRow}>
            {['male', 'female'].map(g => (
              <button
                key={g}
                className={`${styles.pill} ${form.gender === g ? styles.pillActive : ''}`}
                onClick={() => set('gender', g)}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Age</label>
            <input className={styles.formInput} type="number" min="10" max="120" placeholder="28"
              value={form.age} onChange={e => set('age', e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Height (cm)</label>
            <input className={styles.formInput} type="number" min="100" max="250" placeholder="175"
              value={form.heightCm} onChange={e => set('heightCm', e.target.value)} />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Weight (kg)</label>
            <input className={styles.formInput} type="number" min="30" max="300" step="0.1" placeholder="75.0"
              value={form.weightKg} onChange={e => set('weightKg', e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Goal Weight (kg)</label>
            <input className={styles.formInput} type="number" min="30" max="300" step="0.1" placeholder="Optional"
              value={form.goalWeightKg} onChange={e => set('goalWeightKg', e.target.value)} />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Activity Level</label>
          <div className={styles.activityList}>
            {ACTIVITY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`${styles.activityOption} ${form.activityLevel === opt.value ? styles.activityOptionActive : ''}`}
                onClick={() => set('activityLevel', opt.value)}
              >
                <span className={styles.activityLabel}>{opt.label}</span>
                <span className={styles.activityDesc}>{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {goals && (
          <div className={styles.goalsPreview}>
            <p className={styles.goalsPreviewTitle}>Calculated Goals</p>
            <div className={styles.goalsGrid}>
              <div className={styles.goalItem}><span className={styles.goalVal}>{goals.calorieGoal}</span><span className={styles.goalLabel}>kcal</span></div>
              <div className={styles.goalItem}><span className={styles.goalVal}>{goals.proteinGoal}g</span><span className={styles.goalLabel}>Protein</span></div>
              <div className={styles.goalItem}><span className={styles.goalVal}>{goals.carbsGoal}g</span><span className={styles.goalLabel}>Carbs</span></div>
              <div className={styles.goalItem}><span className={styles.goalVal}>{goals.fatGoal}g</span><span className={styles.goalLabel}>Fat</span></div>
            </div>
          </div>
        )}

        {error && <p className={sheetStyles.errorMsg}>{error}</p>}

        <button className={sheetStyles.primaryBtn} onClick={handleSave} disabled={!canSave || saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </Sheet>
  )
}
