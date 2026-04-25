import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'

const FoodLogContext = createContext(null)
const MEAL_SAVE_TIMEOUT_MS = 7000
const API_BASE = import.meta.env.VITE_API_URL || '/api'

export function FoodLogProvider({ children }) {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(false)

  // Pending-delete: meals hidden from view for 4s (undo window)
  const [hiddenMealIds, setHiddenMealIds] = useState(() => new Set())
  const pendingDeleteTimers = useRef({})

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

  async function updateMeal(mealId, data) {
    if (!user) return
    const token = localStorage.getItem('authToken')
    const res = await fetch(`${API_BASE}/meals/${mealId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Update failed (${res.status})`)
    }
    await fetchMeals()
  }

  async function removeMeal(mealId) {
    if (!user) return
    const token = localStorage.getItem('authToken')

    await fetch(`${API_BASE}/meals/${mealId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    })

    setMeals(prev => prev.filter(m => m.id !== mealId))
  }

  // Hides a meal immediately, then permanently deletes after 4s (undo window)
  function scheduleRemoveMeal(mealId) {
    setHiddenMealIds(prev => new Set([...prev, mealId]))

    pendingDeleteTimers.current[mealId] = setTimeout(async () => {
      const token = localStorage.getItem('authToken')
      try {
        await fetch(`${API_BASE}/meals/${mealId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        })
      } catch (err) {
        console.error('[scheduleRemoveMeal] Delete failed', err)
      }
      setMeals(prev => prev.filter(m => m.id !== mealId))
      setHiddenMealIds(prev => {
        const next = new Set(prev)
        next.delete(mealId)
        return next
      })
      delete pendingDeleteTimers.current[mealId]
    }, 4000)
  }

  // Cancels a pending delete and restores the meal
  function undoRemoveMeal(mealId) {
    clearTimeout(pendingDeleteTimers.current[mealId])
    delete pendingDeleteTimers.current[mealId]
    setHiddenMealIds(prev => {
      const next = new Set(prev)
      next.delete(mealId)
      return next
    })
  }

  // Meals visible to the UI (excludes pending-delete meals)
  const visibleMeals = meals.filter(m => !hiddenMealIds.has(m.id))

  const totals = visibleMeals.reduce(
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
      value={{
        meals,
        visibleMeals,
        totals,
        loading,
        selectedDate,
        setSelectedDate,
        logMeal,
        updateMeal,
        removeMeal,
        scheduleRemoveMeal,
        undoRemoveMeal,
        fetchMeals,
      }}
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
