import styles from './home.module.css'
import { CalorieIcon, ProteinIcon, CarbsIcon, FatIcon } from '../../components/NutrientIcons'

export default function NutritionGrid({ totals, settings }) {
  const caloriePercent = Math.min(100, Math.round((totals.calories / settings.calorieGoal) * 100))
  const remaining = settings.calorieGoal - totals.calories
  const isOver = remaining < 0

  return (
    <section className={styles.nutritionGrid}>
      <div className={styles.caloriesCard}>
        <div className={styles.cardHeader}>
          <span className={styles.cardLabel}>Calories</span>
          <span className={styles.cardIcon}><CalorieIcon /></span>
        </div>
        <div className={styles.ringWrap}>
          <div
            className={styles.ring}
            style={{
  '--pct': caloriePercent,
  '--color-start': isOver ? '#ef4444' : '#f59e0b',
  '--color-end':   isOver ? '#fca5a5' : '#fef08a',
}}
          >
            <div className={styles.ringInner}>
              <span className={`${styles.ringCal} ${isOver ? styles.over : ''}`}>
                {Math.round(totals.calories)}
              </span>
              <span className={styles.ringGoal}>{settings.calorieGoal} kcal</span>
              <span className={styles.ringLeft}>
                {isOver ? `${Math.abs(Math.round(remaining))} over` : `${Math.abs(Math.round(remaining))} left`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.macroCards}>
        {[
          { label: 'Protein', value: totals.protein, goal: settings.proteinGoal, icon: <ProteinIcon /> },
          { label: 'Carbs',   value: totals.carbs,   goal: settings.carbsGoal,   icon: <CarbsIcon /> },
          { label: 'Fat',     value: totals.fat,     goal: settings.fatGoal,     icon: <FatIcon /> },
        ].map(({ label, value, goal, icon }) => {
          const pct        = goal > 0 ? Math.min(100, (value / goal) * 100) : 0
          const isOver     = value > goal
          const background = isOver
            ? 'linear-gradient(90deg, #ef4444, #fca5a5)'
            : 'linear-gradient(90deg, #f59e0b, #fef08a)'
          return (
            <div key={label} className={styles.macroCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>{label}</span>
                <span className={styles.cardIcon}>{icon}</span>
              </div>
              <p className={styles.macroValue}>
                <span className={styles.macroNum}>{Math.round(value)}</span>
                <span className={styles.macroGoalText}> / {goal}g</span>
              </p>
              <div className={styles.macroBarTrack}>
                <div className={styles.macroBarFill} style={{ width: `${pct}%`, background }} />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
