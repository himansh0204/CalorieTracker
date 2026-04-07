import { useState, useEffect, useRef, Suspense, lazy } from 'react'
import { useSettings } from '../hooks/useSettings'
import { useAuth } from '../context/AuthContext'
import styles from './Settings.module.css'

const Onboarding = lazy(() => import('./Onboarding'))

const ACTIVITY_LABELS = {
  sedentary: 'Sedentary',
  light: 'Light',
  moderate: 'Moderate',
  active: 'Active',
  very_active: 'Very Active',
}

export default function Settings() {
  const { user, logout } = useAuth()
  const { settings, loading, updateSettings, refetch } = useSettings()
  const [form, setForm] = useState(settings)
  const [saveState, setSaveState] = useState('idle')
  const [toast, setToast] = useState(null)
  const [showBodyStats, setShowBodyStats] = useState(false)
  const toastTimerRef = useRef(null)

  useEffect(() => { setForm(settings) }, [settings])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  function handleChange(key, val) {
    const n = Number(val)
    setForm((f) => ({ ...f, [key]: Number.isFinite(n) ? n : 0 }))
  }

  function showToast(message, kind = 'success') {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ message, kind })
    toastTimerRef.current = setTimeout(() => {
      setToast(null)
      toastTimerRef.current = null
    }, 3500)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaveState('saving')
    const result = await updateSettings(form)
    setSaveState('idle')

    if (result?.ok) {
      showToast('Goals updated', 'success')
    } else {
      showToast('Saved locally. Cloud sync pending.', 'warn')
    }
  }

  const hasStats = settings.weightKg && settings.heightCm && settings.age

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        {loading && <span className={styles.syncing}>Syncing…</span>}
      </header>

      <div className={styles.profile}>
        <img
          src={user?.picture}
          alt={user?.name}
          className={styles.avatar}
          referrerPolicy="no-referrer"
        />
        <div>
          <p className={styles.name}>{user?.name}</p>
          <p className={styles.email}>{user?.email}</p>
        </div>
      </div>

      {/* Body Stats card */}
      <div className={styles.form} style={{ marginBottom: 8 }}>
        <div className={styles.statsTitleRow}>
          <h2 className={styles.sectionTitle}>Body Stats</h2>
          <button
            type="button"
            className={styles.editStatsBtn}
            onClick={() => setShowBodyStats(true)}
          >
            {hasStats ? 'Edit' : 'Set Up'}
          </button>
        </div>

        {hasStats ? (
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statVal}>{settings.weightKg} kg</span>
              <span className={styles.statLabel}>Weight</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statVal}>{settings.heightCm} cm</span>
              <span className={styles.statLabel}>Height</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statVal}>{settings.age} yrs</span>
              <span className={styles.statLabel}>Age</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statVal}>{ACTIVITY_LABELS[settings.activityLevel] || 'Moderate'}</span>
              <span className={styles.statLabel}>Activity</span>
            </div>
          </div>
        ) : (
          <p className={styles.statsEmpty}>Set your stats to get personalized goals</p>
        )}
      </div>

      <form onSubmit={handleSave} className={styles.form}>
        <h2 className={styles.sectionTitle}>Daily Goals</h2>

        <GoalField
          label="Calories"
          unit="kcal"
          value={form.calorieGoal}
          onChange={(v) => handleChange('calorieGoal', v)}
        />
        <GoalField
          label="Protein"
          unit="g"
          value={form.proteinGoal}
          onChange={(v) => handleChange('proteinGoal', v)}
        />
        <GoalField
          label="Carbohydrates"
          unit="g"
          value={form.carbsGoal}
          onChange={(v) => handleChange('carbsGoal', v)}
        />
        <GoalField
          label="Fat"
          unit="g"
          value={form.fatGoal}
          onChange={(v) => handleChange('fatGoal', v)}
        />

        <button type="submit" className={styles.saveBtn} disabled={saveState === 'saving'}>
          {saveState === 'saving' ? 'Saving…' : 'Save goals'}
        </button>
      </form>

      <button className={styles.logoutBtn} onClick={logout}>Sign out</button>

      {toast && (
        <div
          className={`${styles.toast} ${toast.kind === 'warn' ? styles.toastWarn : styles.toastSuccess}`}
          role="status"
          aria-live="polite"
        >
          <span>{toast.message}</span>
          <button
            type="button"
            className={styles.toastClose}
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {showBodyStats && (
        <Suspense fallback={null}>
          <Onboarding
            mode="update"
            onComplete={async () => {
              await refetch()
              setShowBodyStats(false)
              showToast('Stats & goals updated', 'success')
            }}
          />
        </Suspense>
      )}
    </div>
  )
}

function GoalField({ label, unit, value, onChange }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      <div className={styles.fieldRight}>
        <input
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={styles.input}
        />
        <span className={styles.unit}>{unit}</span>
      </div>
    </div>
  )
}
