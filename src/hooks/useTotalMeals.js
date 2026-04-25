import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export function useTotalMeals() {
  const [totalMeals, setTotalMeals] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/analytics/summary`, {
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => setTotalMeals(data.summary?.totalMealsLogged ?? 0))
      .catch(() => setTotalMeals(0))
  }, [])

  return totalMeals
}
