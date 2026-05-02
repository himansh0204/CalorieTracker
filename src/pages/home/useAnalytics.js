import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../utils/api.js'

export function useAnalytics(mealsVersion) {
  const { user } = useAuth()
  const [data, setData] = useState({ streak: 0, loggedDates: [], dailyCalories: new Map() })

  useEffect(() => {
    if (!user) return
    fetch(`${API_BASE}/analytics/summary`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) {
          const days = res.summary.last14Days || []
          const dailyCalories = new Map(days.map((d) => [d.date, parseFloat(d.calories)]))
          setData({
            streak: res.summary.streak,
            loggedDates: days.map((d) => d.date),
            dailyCalories,
          })
        }
      })
      .catch(() => {})
  }, [user, mealsVersion])

  return data
}
