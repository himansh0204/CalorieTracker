import { useFoodLog } from '../context/FoodLogContext'
import styles from './MealCard.module.css'

const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }

export default function MealCard({ meal }) {
  const { removeMeal } = useFoodLog()

  const name = meal.food_name || meal.name || 'Meal'
  const icon = MEAL_ICONS[meal.meal_type] || MEAL_ICONS[meal.mealType] || '🍽️'

  return (
    <div className={styles.card}>
      <span className={styles.icon}>{icon}</span>
      <div className={styles.info}>
        <span className={styles.name}>{name}</span>
        <span className={styles.macros}>
          P {Math.round(meal.protein)}g · C {Math.round(meal.carbs)}g · F {Math.round(meal.fat)}g
        </span>
      </div>
      <span className={styles.calories}>{Math.round(meal.calories)} kcal</span>
      <button
        className={styles.delete}
        onClick={() => removeMeal(meal.id)}
        aria-label={`Remove ${name}`}
      >✕</button>
    </div>
  )
}
