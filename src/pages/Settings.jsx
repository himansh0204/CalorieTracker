import { useState, Suspense, lazy } from 'react'
import { useSettings } from '../hooks/useSettings'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import { IconSettings } from '../components/icons'
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
  const { settings, refetch } = useSettings()
  const [showBodyStats, setShowBodyStats] = useState(false)

  const hasStats = settings.weightKg && settings.heightCm && settings.age

  return (
    <div className={styles.page}>
      <PageHeader title="Settings" icon={IconSettings} />

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

      <div className={styles.form}>
        <h2 className={styles.sectionTitle}>Daily Goals</h2>
        <p className={styles.statsEmpty} style={{ marginBottom: 12 }}>
          Goals are calculated from your body stats. Edit your stats above to update them.
        </p>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Calories</span>
          <span className={styles.fieldValue}>{settings.calorieGoal} kcal</span>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Protein</span>
          <span className={styles.fieldValue}>{settings.proteinGoal} g</span>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Carbohydrates</span>
          <span className={styles.fieldValue}>{settings.carbsGoal} g</span>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Fat</span>
          <span className={styles.fieldValue}>{settings.fatGoal} g</span>
        </div>
      </div>

      <button className={styles.logoutBtn} onClick={logout}>Sign out</button>

      {showBodyStats && (
        <Suspense fallback={null}>
          <Onboarding
            mode="update"
            onComplete={async () => {
              await refetch()
              setShowBodyStats(false)
            }}
          />
        </Suspense>
      )}
    </div>
  )
}
