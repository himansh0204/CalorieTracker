import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import EmptyMealState from '../components/EmptyMealState'
import { useTotalMeals } from '../hooks/useTotalMeals'
import { IconHistory } from '../components/icons'
import styles from './History.module.css'

const API_URL = import.meta.env.VITE_API_URL || '/api'

async function apiFetch(path) {
  const token = localStorage.getItem('authToken')
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('API error')
  return res.json()
}

export default function History() {
  const { user } = useAuth()
  const totalMeals = useTotalMeals()
  const [dates, setDates] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [mealsCache, setMealsCache] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    // Fetch meals from the last 30 days, extract unique dates
    const end = new Date().toISOString().slice(0, 10)
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    apiFetch(`/meals?startDate=${start}&endDate=${end}`)
      .then((data) => {
        const uniqueDates = [...new Set((data.meals || []).map((m) => m.logged_at.slice(0, 10)))]
          .sort((a, b) => b.localeCompare(a))
        setDates(uniqueDates)
        // Pre-fill cache grouped by date
        const grouped = {}
        for (const meal of data.meals || []) {
          const d = meal.logged_at.slice(0, 10)
          if (!grouped[d]) grouped[d] = []
          grouped[d].push(meal)
        }
        setMealsCache(grouped)
      })
      .finally(() => setLoading(false))
  }, [user])

  async function toggle(date) {
    if (expanded === date) { setExpanded(null); return }
    setExpanded(date)
    if (!mealsCache[date]) {
      const data = await apiFetch(`/meals?startDate=${date}&endDate=${date}`)
      setMealsCache((c) => ({ ...c, [date]: data.meals || [] }))
    }
  }

  function sumMeals(meals) {
    return meals.reduce(
      (acc, m) => ({
        calories: acc.calories + (m.calories || 0),
        protein: acc.protein + (m.protein || 0),
        carbs: acc.carbs + (m.carbs || 0),
        fat: acc.fat + (m.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )
  }

  return (
    <div className={styles.page}>
      <PageHeader title="History" icon={IconHistory} />

      {loading && <p className={styles.empty}>Loading…</p>}
      {!loading && totalMeals === 0 && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '16px' }}>
          <EmptyMealState />
        </div>
      )}

      <ul className={styles.list}>
        {dates.map((date) => {
          const meals = mealsCache[date]
          const totals = meals ? sumMeals(meals) : null
          const isOpen = expanded === date

          return (
            <li key={date} className={styles.item}>
              <button className={styles.dayRow} onClick={() => toggle(date)}>
                <div className={styles.dateBlock}>
                  <span className={styles.dayName}>{formatDay(date)}</span>
                  <span className={styles.dateStr}>{formatFull(date)}</span>
                </div>
                {totals && (
                  <span className={styles.calTotal}>{Math.round(totals.calories)} kcal</span>
                )}
                <span className={`${styles.chevron} ${isOpen ? styles.open : ''}`}>›</span>
              </button>

              {isOpen && meals && (
                <div className={styles.detail}>
                  <div className={styles.macroSummary}>
                    <span>P {Math.round(totals.protein)}g</span>
                    <span>C {Math.round(totals.carbs)}g</span>
                    <span>F {Math.round(totals.fat)}g</span>
                  </div>
                  {meals.map((m) => (
                    <div key={m.id} className={styles.mealRow}>
                      <span className={styles.mealName}>{m.name}</span>
                      <span className={styles.mealCal}>{Math.round(m.calories)} kcal</span>
                    </div>
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function formatDay(str) {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (str === today) return 'Today'
  if (str === yesterday) return 'Yesterday'
  return new Date(str).toLocaleDateString('en-US', { weekday: 'short' })
}

function formatFull(str) {
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
