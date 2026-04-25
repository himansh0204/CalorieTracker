import { useEffect, useState } from 'react'
import { useFoodLog } from '../context/FoodLogContext'
import { useSettings } from '../hooks/useSettings'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import MealCard from '../components/MealCard'
import EmptyMealState from '../components/EmptyMealState'
import styles from './Dashboard.module.css'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

function useAnalytics() {
  const { user } = useAuth()
  const [data, setData] = useState({ streak: 0, loggedDates: [] })

  useEffect(() => {
    if (!user) return
    const token = localStorage.getItem('authToken')
    fetch(`${API_BASE}/analytics/summary`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) {
          setData({
            streak: res.summary.streak,
            loggedDates: res.summary.last7Days.map((d) => d.date),
          })
        }
      })
      .catch(() => {})
  }, [user])

  return data
}

function WeekStrip({ loggedDates }) {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))

  const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const loggedSet = new Set(loggedDates)

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    return {
      label: DAY_LABELS[i],
      date: d.getDate(),
      dateStr,
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
      isLogged: loggedSet.has(dateStr),
    }
  })

  return (
    <div className={styles.weekStrip}>
      {week.map(({ label, date, dateStr, isToday, isFuture, isLogged }) => (
        <div key={dateStr} className={styles.weekDay}>
          <div
            className={[
              styles.weekCircle,
              isToday ? styles.weekToday : '',
              isLogged && !isToday ? styles.weekLogged : '',
              isFuture ? styles.weekFuture : '',
            ].join(' ')}
          >
            <span className={styles.weekLabel}>{label}</span>
          </div>
          <span className={`${styles.weekDate} ${isToday ? styles.weekDateToday : ''}`}>
            {date}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { meals, totals, loading, selectedDate, setSelectedDate } = useFoodLog()
  const { settings } = useSettings()
  const { streak, loggedDates } = useAnalytics()
  const [reportState, setReportState] = useState('closed') // closed | loading | open | error
  const [reportText, setReportText] = useState('')

  async function openReport() {
    setReportState('loading')
    setReportText('')
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(`${API_BASE}/analytics/weekly-report`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed')
      setReportText(data.report)
      setReportState('open')
    } catch {
      setReportState('error')
    }
  }

  const caloriePercent = Math.min(100, Math.round((totals.calories / settings.calorieGoal) * 100))
  const remaining = settings.calorieGoal - totals.calories
  const isOver = remaining < 0

  function changeDay(offset) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + offset)
    const str = d.toISOString().slice(0, 10)
    const today = new Date().toISOString().slice(0, 10)
    if (str <= today) setSelectedDate(str)
  }

  const displayDate = formatDate(selectedDate)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Daily Nutrition</p>
          <h1 className={styles.greeting}>Hi, {firstName(user?.name)}</h1>
        </div>
        <div className={styles.headerRight}>
          {streak > 0 && (
            <div className={styles.streakPill}>
              <span>🔥</span>
              <span className={styles.streakNum}>{streak}</span>
            </div>
          )}
          <img src={user?.picture} alt={user?.name} className={styles.avatar} referrerPolicy="no-referrer" />
        </div>
      </header>

      <WeekStrip loggedDates={loggedDates} />

      <div className={styles.dateNavRow}>
        <div className={styles.dateNav}>
          <button onClick={() => changeDay(-1)} aria-label="Previous day">‹</button>
          <span className={styles.dateLabel}>{displayDate}</span>
          <button
            onClick={() => changeDay(1)}
            disabled={selectedDate === new Date().toISOString().slice(0, 10)}
            aria-label="Next day"
          >›</button>
        </div>
      </div>

      <section className={styles.nutritionGrid}>
        {/* Left — Calories card */}
        <div className={styles.caloriesCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Calories</span>
            <span className={styles.cardIcon}>🔥</span>
          </div>
          <div className={styles.ringWrap}>
            <div
              className={styles.ring}
              style={{ '--pct': caloriePercent, '--color': isOver ? '#ef4444' : 'var(--primary)' }}
            >
              <div className={styles.ringInner}>
                <span className={`${styles.ringCal} ${isOver ? styles.over : ''}`}>
                  {Math.round(totals.calories)}
                </span>
                <span className={styles.ringGoal}>{settings.calorieGoal} kcal</span>
                <span className={styles.ringLeft}>
                  {isOver ? `${Math.abs(Math.round(remaining))} over` : `${Math.abs(Math.round(remaining))} left`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Macro cards */}
        <div className={styles.macroCards}>
          {[
            { label: 'Protein', value: totals.protein, goal: settings.proteinGoal, color: '#ef4444', icon: '🫀' },
            { label: 'Carbs',   value: totals.carbs,   goal: settings.carbsGoal,   color: '#f59e0b', icon: '🌾' },
            { label: 'Fat',     value: totals.fat,     goal: settings.fatGoal,     color: '#3b82f6', icon: '💧' },
          ].map(({ label, value, goal, color, icon }) => {
            const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0
            return (
              <div key={label} className={styles.macroCard}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardLabel}>{label}</span>
                  <span className={styles.cardIcon}>{icon}</span>
                </div>
                <p className={styles.macroValue}>
                  <span className={styles.macroNum}>{Math.round(value)}</span>
                  <span className={styles.macroGoalText}> / {goal}g</span>
                </p>
                <div className={styles.macroBarTrack}>
                  <div className={styles.macroBarFill} style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className={styles.quickActions}>
        <Link to="/scanner" className={styles.actionCard}>
          <span className={styles.actionTitle}>Add Meal</span>
          <span className={styles.actionSub}>Snap the photo</span>
        </Link>
        <Link to="/history" className={styles.actionCard}>
          <span className={styles.actionTitle}>View History</span>
          <span className={styles.actionSub}>Track your streak</span>
        </Link>
        <button className={`${styles.actionCard} ${styles.reportCard}`} onClick={openReport}>
          <span className={styles.reportIcon}>✨</span>
          <span className={styles.actionTitle}>Weekly Report</span>
          <span className={styles.actionSub}>AI nutrition insights</span>
        </button>
      </section>

      {/* Weekly Report bottom sheet */}
      {reportState !== 'closed' && (
        <div className={styles.sheetBackdrop} onClick={() => setReportState('closed')}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHandle} />
            <div className={styles.sheetHeader}>
              <h2 className={styles.sheetTitle}>✨ Weekly Report</h2>
              <button className={styles.sheetClose} onClick={() => setReportState('closed')}>✕</button>
            </div>

            {reportState === 'loading' && (
              <div className={styles.sheetLoading}>
                <div className={styles.sheetSpinner} />
                <p>Analysing your week…</p>
              </div>
            )}

            {reportState === 'error' && (
              <div className={styles.sheetLoading}>
                <p>Failed to generate report. Try again.</p>
                <button className={styles.retryBtn} onClick={openReport}>Retry</button>
              </div>
            )}

            {reportState === 'open' && (
              <div className={styles.sheetBody}>
                {reportText.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) {
                    return <h3 key={i} className={styles.reportSection}>{line.slice(3)}</h3>
                  }
                  if (line.startsWith('- ') || line.startsWith('• ')) {
                    return <p key={i} className={styles.reportBullet}>{line.slice(2)}</p>
                  }
                  if (line.trim() === '') return null
                  return <p key={i} className={styles.reportPara}>{line}</p>
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <section className={styles.mealList}>
        <div className={styles.mealHeader}>
          <h2 className={styles.sectionTitle}>Today's meals</h2>
          <span className={styles.mealCount}>{meals.length} items</span>
        </div>
        <div className={styles.mealScroll}>
          {loading && <p className={styles.empty}>Loading…</p>}
          {!loading && meals.length === 0 && <EmptyMealState />}
          {meals.length > 0 && (
            <div>{meals.map((m) => <MealCard key={m.id} meal={m} />)}</div>
          )}
        </div>
      </section>
    </div>
  )
}


function formatDate(str) {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (str === today) return 'Today'
  if (str === yesterday) return 'Yesterday'
  return new Date(str).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function firstName(name) {
  if (!name) return 'there'
  return String(name).trim().split(' ')[0]
}
