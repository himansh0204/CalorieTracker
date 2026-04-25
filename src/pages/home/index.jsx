import { useState } from 'react'
import { useFoodLog } from '../../context/FoodLogContext'
import { useSettings } from '../../hooks/useSettings'
import WeekStrip from './WeekStrip'
import NutritionGrid from './NutritionGrid'
import QuickActions from './QuickActions'
import WeeklyReportSheet from './WeeklyReportSheet'
import MealList from './MealList'
import { useAnalytics } from './useAnalytics'
import styles from './home.module.css'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export default function Home() {
  const { meals, visibleMeals, totals, loading, selectedDate, setSelectedDate } = useFoodLog()
  const { settings } = useSettings()
  const { streak } = useAnalytics(meals.length)
  const [reportState, setReportState] = useState('closed')
  const [reportText, setReportText] = useState('')

  async function openReport() {
    setReportState('loading')
    setReportText('')
    try {
      const res = await fetch(`${API_BASE}/analytics/weekly-report`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed')
      setReportText(data.report)
      setReportState('open')
    } catch {
      setReportState('error')
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brandRow}>
          <img src="/logo.png" alt="CalQube" className={styles.brandLogo} />
          <span className={styles.brandName}>CalQube</span>
        </div>
        <div className={styles.headerRight}>
          {streak > 0 && (
            <div className={styles.streakPill}>
              <span>🔥</span>
              <span className={styles.streakNum}>{streak}</span>
            </div>
          )}
        </div>
      </header>

      <WeekStrip
        calorieGoal={settings.calorieGoal}
        mealsVersion={meals.length}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />

      <NutritionGrid totals={totals} settings={settings} />

      <QuickActions onReportClick={openReport} />

      <WeeklyReportSheet
        state={reportState}
        text={reportText}
        onClose={() => setReportState('closed')}
        onRetry={openReport}
      />

      <MealList meals={visibleMeals} loading={loading} selectedDate={selectedDate} />
    </div>
  )
}

