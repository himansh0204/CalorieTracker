import { localDateStr, localYesterdayStr } from '../../utils/dates'
import styles from './history.module.css'

function getMealStyle(meal) {
  const type = meal.meal_type || meal.mealType
  if (type === 'breakfast') return { emoji: '🌅', color: '#f97316' }
  if (type === 'lunch')     return { emoji: '🍱', color: '#22c55e' }
  if (type === 'dinner')    return { emoji: '🌙', color: '#6366f1' }
  if (type === 'snack')     return { emoji: '🍎', color: '#ec4899' }
  const hour = meal.logged_at ? new Date(meal.logged_at).getHours() : 12
  if (hour >= 5  && hour < 11) return { emoji: '🌅', color: '#f97316' }
  if (hour >= 11 && hour < 16) return { emoji: '🍱', color: '#22c55e' }
  if (hour >= 16 && hour < 21) return { emoji: '🌙', color: '#6366f1' }
  return { emoji: '🍎', color: '#ec4899' }
}

function sumMeals(meals) {
  return meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (parseFloat(m.calories) || 0),
      protein:  acc.protein  + (parseFloat(m.protein)  || 0),
      carbs:    acc.carbs    + (parseFloat(m.carbs)    || 0),
      fat:      acc.fat      + (parseFloat(m.fat)      || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

export default function HistoryDayRow({ date, meals, isOpen, onToggle }) {
  const totals = meals ? sumMeals(meals) : null

  return (
    <li className={styles.item}>
      <button className={styles.dayRow} onClick={onToggle}>
        <div className={styles.dateBlock}>
          <span className={styles.dayName}>{formatDay(date)}</span>
          <span className={styles.dateStr}>{formatFull(date)}</span>
        </div>
        {totals && (
          <div className={styles.dayRight}>
            <span className={styles.calTotal}>🔥 {Math.round(totals.calories)}</span>
            <span className={styles.mealCount}>{meals.length} meal{meals.length !== 1 ? 's' : ''}</span>
          </div>
        )}
        <span className={`${styles.chevron} ${isOpen ? styles.open : ''}`}>›</span>
      </button>

      {isOpen && meals && (
        <div className={styles.detail}>
          <div className={styles.macroSummary}>
            <span>💪 {Math.round(totals.protein)}g protein</span>
            <span>🌾 {Math.round(totals.carbs)}g carbs</span>
            <span>🥑 {Math.round(totals.fat)}g fat</span>
          </div>
          {meals.map((m) => {
            const { emoji, color } = getMealStyle(m)
            return (
              <div key={m.id} className={styles.mealRow}>
                <div
                  className={styles.mealThumb}
                  style={{ background: color + '22', borderColor: color + '55' }}
                >
                  <span className={styles.mealThumbEmoji}>{emoji}</span>
                </div>
                <div className={styles.mealInfo}>
                  <span className={styles.mealName}>{m.food_name || m.name || 'Meal'}</span>
                  <span className={styles.mealMacros}>
                    P {Math.round(m.protein)}g · C {Math.round(m.carbs)}g · F {Math.round(m.fat)}g
                  </span>
                </div>
                <div className={styles.mealCalWrap}>
                  <span className={styles.mealCal}>{Math.round(m.calories)}</span>
                  <span className={styles.mealCalUnit}>kcal</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </li>
  )
}

function formatDay(str) {
  const today = localDateStr()
  const yesterday = localYesterdayStr()
  if (str === today) return 'Today'
  if (str === yesterday) return 'Yesterday'
  return new Date(str).toLocaleDateString('en-US', { weekday: 'short' })
}

function formatFull(str) {
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
