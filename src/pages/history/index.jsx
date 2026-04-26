import { useState, useEffect } from 'react'
import { localDateStr } from '../../utils/dates'
import { useAuth } from '../../context/AuthContext'
import { useFoodLog } from '../../context/FoodLogContext'
import EmptyMealState from '../../components/EmptyMealState'
import { SkeletonHistoryRow } from '../../components/Skeleton'
import HistoryDayRow from './HistoryDayRow'
import styles from './history.module.css'

const API_URL = import.meta.env.VITE_API_URL || '/api'

async function apiFetch(path) {
  const res = await fetch(`${API_URL}${path}`, { credentials: 'include' })
  if (!res.ok) throw new Error('API error')
  return res.json()
}

export default function History() {
  const { user } = useAuth()
  const { mealsVersion, hiddenMealIds } = useFoodLog()

  const [dates, setDates] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [mealsCache, setMealsCache] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const end = localDateStr()
    const d = new Date(); d.setDate(d.getDate() - 30)
    const start = localDateStr(d)
    apiFetch(`/meals?startDate=${start}&endDate=${end}`)
      .then((data) => {
        const uniqueDates = [...new Set((data.meals || []).map((m) => localDateStr(new Date(m.logged_at))))]
          .sort((a, b) => b.localeCompare(a))
        setDates(uniqueDates)
        const grouped = {}
        for (const meal of data.meals || []) {
          const d = localDateStr(new Date(meal.logged_at))
          if (!grouped[d]) grouped[d] = []
          grouped[d].push(meal)
        }
        setMealsCache(grouped)
      })
      .finally(() => setLoading(false))
  }, [user, mealsVersion])

  async function toggle(date) {
    if (expanded === date) { setExpanded(null); return }
    setExpanded(date)
    if (!mealsCache[date]) {
      const data = await apiFetch(`/meals?startDate=${date}&endDate=${date}`)
      setMealsCache((c) => ({ ...c, [date]: data.meals || [] }))
    }
  }

  const visibleDates = dates
    .map((date) => ({
      date,
      meals: (mealsCache[date] || []).filter((m) => !hiddenMealIds.has(m.id)),
    }))
    .filter(({ meals }) => meals.length > 0)

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>History</h1>

      {loading && (
        <ul className={styles.list}>
          {[1, 2, 3, 4, 5].map(i => (
            <li key={i} className={styles.item}>
              <SkeletonHistoryRow />
            </li>
          ))}
        </ul>
      )}

      {!loading && visibleDates.length === 0 && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '16px' }}>
          <EmptyMealState />
        </div>
      )}

      {!loading && visibleDates.length > 0 && (
        <ul className={styles.list}>
          {visibleDates.map(({ date, meals }) => (
            <HistoryDayRow
              key={date}
              date={date}
              meals={meals}
              isOpen={expanded === date}
              onToggle={() => toggle(date)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
