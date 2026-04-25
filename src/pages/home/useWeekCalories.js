import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export function useWeekCalories(mealsVersion) {
  const { user } = useAuth()
  const [calMap, setCalMap] = useState(new Map())

  useEffect(() => {
    if (!user) return
    const token = localStorage.getItem('authToken')

    Promise.all([
      fetch(`${API_BASE}/analytics/progress?period=week`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
      fetch(`${API_BASE}/analytics/progress?period=last-week`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
    ])
      .then(([thisWeek, lastWeek]) => {
        const map = new Map()
        const allDays = [
          ...(thisWeek.ok  ? thisWeek.days  : []),
          ...(lastWeek.ok  ? lastWeek.days  : []),
        ]
        for (const d of allDays) {
          // only mark as logged if there are actual calories
          if (d.calories > 0) map.set(d.date, d.calories)
        }
        setCalMap(map)
      })
      .catch(() => {})
  }, [user, mealsVersion])

  return calMap
}
