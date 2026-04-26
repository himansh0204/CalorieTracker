import { useState, useEffect } from 'react'
import { localDateStr, localYesterdayStr } from '../../utils/dates'
import { useAuth } from '../../context/AuthContext'
import { useFoodLog } from '../../context/FoodLogContext'
import MealCard from '../../components/MealCard'
import EmptyMealState from '../../components/EmptyMealState'
import { SkeletonMealCard } from '../../components/Skeleton'
import styles from './history.module.css'

const API_URL = import.meta.env.VITE_API_URL || '/api'

async function apiFetch(path) {
  const res = await fetch(`${API_URL}${path}`, { credentials: 'include' })
  if (!res.ok) throw new Error('API error')
  return res.json()
}

function formatDateLabel(str) {
  const today = localDateStr()
  const yesterday = localYesterdayStr()
  if (str === today) return 'Today'
  if (str === yesterday) return 'Yesterday'
  return new Date(str).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export default function History() {
  const { user } = useAuth()
  const { mealsVersion, hiddenMealIds } = useFoodLog()

  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const end = localDateStr()
    const d = new Date(); d.setDate(d.getDate() - 7)
    const start = localDateStr(d)
    apiFetch(`/meals?startDate=${start}&endDate=${end}`)
      .then((data) => {
        const sorted = (data.meals || []).sort(
          (a, b) => new Date(b.logged_at) - new Date(a.logged_at)
        )
        setMeals(sorted)
      })
      .finally(() => setLoading(false))
  }, [user, mealsVersion])

  const visibleMeals = meals.filter((m) => !hiddenMealIds.has(m.id))

  // Group into date sections for separators
  const sections = []
  let lastDate = null
  for (const meal of visibleMeals) {
    const date = localDateStr(new Date(meal.logged_at))
    if (date !== lastDate) {
      sections.push({ type: 'date', date, key: `sep-${date}` })
      lastDate = date
    }
    sections.push({ type: 'meal', meal, key: `meal-${meal.id}` })
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>History</h1>

      {loading && (
        <div className={styles.list}>
          {[1, 2, 3, 4].map(i => <SkeletonMealCard key={i} />)}
        </div>
      )}

      {!loading && visibleMeals.length === 0 && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '16px' }}>
          <EmptyMealState />
        </div>
      )}

      {!loading && visibleMeals.length > 0 && (
        <div className={styles.list}>
          {sections.map(item =>
            item.type === 'date' ? (
              <p key={item.key} className={styles.dateSeparator}>{formatDateLabel(item.date)}</p>
            ) : (
              <MealCard key={item.key} meal={item.meal} />
            )
          )}
        </div>
      )}
    </div>
  )
}
