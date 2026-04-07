import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'

const FoodLogContext = createContext(null)
const MEAL_SAVE_TIMEOUT_MS = 7000
const API_BASE = import.meta.env.VITE_API_URL || '/api'

export function FoodLogProvider({ children }) {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchMeals = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await withTimeout(
        fetch(`${API_BASE}/meals?startDate=${selectedDate}&endDate=${selectedDate}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        MEAL_SAVE_TIMEOUT_MS
      )

      if (!response.ok) throw new Error('Failed to fetch meals')
      const data = await response.json()
      setMeals(data.meals || [])
    } finally {
      setLoading(false)
    }
  }, [user, selectedDate])

  useEffect(() => { fetchMeals() }, [fetchMeals])

  async function logMeal(meal) {
    if (!user) return
    const token = localStorage.getItem('authToken')
    
    await withTimeout(
      fetch(`${API_BASE}/meals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          foodName: meal.name,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          servingSize: meal.servingSize,
          foodId: meal.foodId,
        }),
      }).then(r => {
        if (!r.ok) throw new Error('Failed to log meal')
        return r.json()
      }),
      MEAL_SAVE_TIMEOUT_MS
    )
    
    await withTimeout(fetchMeals(), MEAL_SAVE_TIMEOUT_MS)
  }

  async function removeMeal(mealId) {
    if (!user) return
    const token = localStorage.getItem('authToken')
    
    await fetch(`${API_BASE}/meals/${mealId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    })
    
    setMeals((prev) => prev.filter((m) => m.id !== mealId))
  }

  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (parseFloat(m.calories) || 0),
      protein: acc.protein + (parseFloat(m.protein) || 0),
      carbs: acc.carbs + (parseFloat(m.carbs) || 0),
      fat: acc.fat + (parseFloat(m.fat) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  return (
    <FoodLogContext.Provider
      value={{ meals, totals, loading, selectedDate, setSelectedDate, logMeal, removeMeal, fetchMeals }}
    >
      {children}
    </FoodLogContext.Provider>
  )
}

export function useFoodLog() {
  return useContext(FoodLogContext)
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('meal-save-timeout')), timeoutMs)
    }),
  ])
}
