import { useFoodLog } from '../context/FoodLogContext'
import { useSettings } from '../hooks/useSettings'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import MacroRing from '../components/MacroRing'
import MealCard from '../components/MealCard'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { user } = useAuth()
  const { meals, totals, loading, selectedDate, setSelectedDate } = useFoodLog()
  const { settings } = useSettings()

  const caloriePercent = Math.min(100, Math.round((totals.calories / settings.calorieGoal) * 100))
  const calorieProgress = settings.calorieGoal > 0 ? Math.min(100, (totals.calories / settings.calorieGoal) * 100) : 0
  const remaining = settings.calorieGoal - totals.calories
  const isOver = remaining < 0

  function changeDay(offset) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + offset)
    const str = d.toISOString().slice(0, 10)
    const today = new Date().toISOString().slice(0, 10)
    if (str <= today) setSelectedDate(str)
  }

  const displayDate = formatDate(selectedDate)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Daily Nutrition</p>
          <h1 className={styles.greeting}>Hi, {firstName(user?.displayName)}</h1>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateNav}>
            <button onClick={() => changeDay(-1)} aria-label="Previous day">‹</button>
            <span className={styles.dateLabel}>{displayDate}</span>
            <button
              onClick={() => changeDay(1)}
              disabled={selectedDate === new Date().toISOString().slice(0, 10)}
              aria-label="Next day"
            >›</button>
          </div>
          <img src={user?.photoURL} alt={user?.displayName} className={styles.avatar} referrerPolicy="no-referrer" />
        </div>
      </header>

      <section className={styles.summary}>
        <div className={styles.summaryTop}>
          <div>
            <p className={styles.summaryTitle}>Calories</p>
            <p className={styles.summarySub}>{Math.round(totals.calories)} of {settings.calorieGoal} kcal</p>
          </div>
          <div className={styles.percentPill}>{Math.round(calorieProgress)}%</div>
        </div>

        <div className={styles.ringWrap}>
          <div
            className={styles.ring}
            style={{ '--pct': caloriePercent, '--color': isOver ? '#ef4444' : '#4f46e5' }}
          >
            <div className={styles.ringInner}>
              <span className={`${styles.ringCal} ${isOver ? styles.over : ''}`}>
                {Math.abs(remaining)}
              </span>
              <span className={styles.ringLabel}>{isOver ? 'over' : 'remaining'}</span>
            </div>
          </div>
        </div>

        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${Math.max(6, calorieProgress)}%` }} />
        </div>

        <div className={styles.macros}>
          <MacroRing label="Protein" value={totals.protein} goal={settings.proteinGoal} color="#3b82f6" unit="g" />
          <MacroRing label="Carbs" value={totals.carbs} goal={settings.carbsGoal} color="#f59e0b" unit="g" />
          <MacroRing label="Fat" value={totals.fat} goal={settings.fatGoal} color="#10b981" unit="g" />
        </div>

        <div className={styles.statsRow}>
          <Stat label="Goal" value={settings.calorieGoal} />
          <Stat label="Eaten" value={Math.round(totals.calories)} />
          <Stat label={isOver ? 'Over' : 'Left'} value={Math.abs(Math.round(remaining))} accent={isOver} />
        </div>
      </section>

      <section className={styles.quickActions}>
        <Link to="/log" className={styles.actionCard}>
          <span className={styles.actionTitle}>Add Meal</span>
          <span className={styles.actionSub}>Search foods quickly</span>
        </Link>
        <Link to="/scanner" className={styles.actionCard}>
          <span className={styles.actionTitle}>Scan Barcode</span>
          <span className={styles.actionSub}>Camera food lookup</span>
        </Link>
        <Link to="/history" className={styles.actionCard}>
          <span className={styles.actionTitle}>View History</span>
          <span className={styles.actionSub}>Track your streak</span>
        </Link>
      </section>

      <section className={styles.mealList}>
        <div className={styles.mealHeader}>
          <h2 className={styles.sectionTitle}>Today's meals</h2>
          <span className={styles.mealCount}>{meals.length} items</span>
        </div>
        {loading && <p className={styles.empty}>Loading…</p>}
        {!loading && meals.length === 0 && (
          <p className={styles.empty}>No meals logged yet. Tap ➕ to add one.</p>
        )}
        {meals.map((m) => <MealCard key={m.id} meal={m} />)}
      </section>
    </div>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div className={styles.stat}>
      <span className={`${styles.statValue} ${accent ? styles.accent : ''}`}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}

function formatDate(str) {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (str === today) return 'Today'
  if (str === yesterday) return 'Yesterday'
  return new Date(str).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function firstName(name) {
  if (!name) return 'there'
  return String(name).trim().split(' ')[0]
}
