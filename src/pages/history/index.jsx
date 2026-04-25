import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useFoodLog } from '../../context/FoodLogContext'
import PageHeader from '../../components/PageHeader'
import EmptyMealState from '../../components/EmptyMealState'
import { SkeletonHistoryRow } from '../../components/Skeleton'
import { useTotalMeals } from '../../hooks/useTotalMeals'
import { IconHistory } from '../../components/icons'
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
  const { mealsVersion } = useFoodLog()
  const totalMeals = useTotalMeals()
  const [dates, setDates] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [mealsCache, setMealsCache] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const end = new Date().toISOString().slice(0, 10)
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    apiFetch(`/meals?startDate=${start}&endDate=${end}`)
      .then((data) => {
        const uniqueDates = [...new Set((data.meals || []).map((m) => m.logged_at.slice(0, 10)))]
          .sort((a, b) => b.localeCompare(a))
        setDates(uniqueDates)
        const grouped = {}
        for (const meal of data.meals || []) {
          const d = meal.logged_at.slice(0, 10)
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

  return (
    <div className={styles.page}>
      <PageHeader title="History" icon={IconHistory} />

      {loading && (
        <ul className={styles.list}>
          {[1, 2, 3, 4, 5].map(i => (
            <li key={i} className={styles.item}>
              <SkeletonHistoryRow />
            </li>
          ))}
        </ul>
      )}

      {!loading && totalMeals === 0 && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '16px' }}>
          <EmptyMealState />
        </div>
      )}

      {!loading && dates.length > 0 && (
        <ul className={styles.list}>
          {dates.map((date) => (
            <HistoryDayRow
              key={date}
              date={date}
              meals={mealsCache[date]}
              isOpen={expanded === date}
              onToggle={() => toggle(date)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
