import { useState, useEffect, Fragment } from 'react'
import styles from './progress.module.css'

const API_BASE = import.meta.env.VITE_API_URL || '/api'
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function buildMonthGrid(year, month) {
  const firstDow = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weeks = []
  let week = Array(firstDow).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d)
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length) { while (week.length < 7) week.push(null); weeks.push(week) }
  return weeks
}

export default function CalendarCard() {
  const [loggedDates, setLoggedDates] = useState(new Set())
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/analytics/progress?period=month`, {
          credentials: 'include',
        })
        const json = await res.json()
        if (json.ok) {
          const logged = new Set(
            json.days.filter(d => d.calories > 0).map(d => parseInt(d.date.slice(8, 10)))
          )
          setLoggedDates(logged)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const weeks = buildMonthGrid(year, month)
  const loggedCount = loggedDates.size

  return (
    <div className={styles.bmiCard}>
      <div className={styles.calHeader}>
        <p className={styles.sectionHeading}>Days Logged</p>
        <span className={styles.calCount}>
          <span className={styles.calCountNum}>{loggedCount}</span>
          <span className={styles.calCountTotal}>/{daysInMonth}</span>
        </span>
      </div>

      <p className={styles.calMonthLabel}>{monthLabel}</p>

      {loading ? (
        <div className={styles.calLoading}><div className={styles.spinner} /></div>
      ) : (
        <div className={styles.calGrid}>
          {/* Day headers */}
          <div className={styles.calWeekLabel} />
          {DAY_LABELS.map((l, i) => (
            <div key={i} className={styles.calDayHeader}>{l}</div>
          ))}

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <Fragment key={wi}>
              <div className={styles.calWeekLabel}>Wk {wi + 1}</div>
              {week.map((day, di) => {
                if (!day) return <div key={`e-${wi}-${di}`} />
                const isFuture = day > today
                const isLogged = loggedDates.has(day)
                const isToday = day === today
                return (
                  <div
                    key={`d-${wi}-${di}`}
                    className={`${styles.calDay} ${isLogged ? styles.calDayLogged : ''} ${isFuture ? styles.calDayFuture : ''} ${isToday && !isLogged ? styles.calDayToday : ''}`}
                  >
                    {isLogged ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <span className={styles.calDayNum}>{day}</span>
                    )}
                  </div>
                )
              })}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  )
}
