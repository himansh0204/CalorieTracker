import { useState, useEffect } from 'react'
import { API_BASE } from '../utils/api.js'

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
