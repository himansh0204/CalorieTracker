import { useState, useEffect, useRef } from 'react'
import { useSettings } from '../hooks/useSettings'
import { useAuth } from '../context/AuthContext'
import styles from './Settings.module.css'

export default function Settings() {
  const { user, logout } = useAuth()
  const { settings, loading, updateSettings } = useSettings()
  const [form, setForm] = useState(settings)
  const [saveState, setSaveState] = useState('idle') // idle | saving
  const [toast, setToast] = useState(null)
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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        {loading && <span className={styles.syncing}>Syncing…</span>}
      </header>

      <div className={styles.profile}>
        <img src={user?.photoURL} alt={user?.displayName} className={styles.avatar} referrerPolicy="no-referrer" />
        <div>
          <p className={styles.name}>{user?.displayName}</p>
          <p className={styles.email}>{user?.email}</p>
        </div>
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
          {saveState === 'saving' && 'Saving…'}
          {saveState === 'idle' && 'Save goals'}
        </button>
      </form>

      <button className={styles.logoutBtn} onClick={logout}>Sign out</button>

      {toast && (
        <div className={`${styles.toast} ${toast.kind === 'warn' ? styles.toastWarn : styles.toastSuccess}`} role="status" aria-live="polite">
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
