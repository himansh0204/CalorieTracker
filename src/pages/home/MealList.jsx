import { Link } from 'react-router-dom'
import MealCard from '../../components/MealCard'
import EmptyMealState from '../../components/EmptyMealState'
import { SkeletonMealCard } from '../../components/Skeleton'
import styles from './home.module.css'

export default function MealList({ meals, loading, selectedDate }) {
  return (
    <section className={styles.mealList}>
      <div className={styles.mealHeader}>
        <h2 className={styles.sectionTitle}>{activityTitle(selectedDate)}</h2>
        <Link to="/history" className={styles.seeAll}>See All</Link>
      </div>
      <div className={styles.mealScroll}>
        {loading && (
          <>
            <SkeletonMealCard />
            <SkeletonMealCard />
            <SkeletonMealCard />
          </>
        )}
        {!loading && meals.length === 0 && (
          selectedDate === new Date().toISOString().slice(0, 10)
            ? <div className={styles.emptyWrap}><EmptyMealState /></div>
            : <p className={styles.empty}>No meals logged</p>
        )}
        {!loading && meals.length > 0 && (
          <div>{meals.map((m) => <MealCard key={m.id} meal={m} />)}</div>
        )}
      </div>
    </section>
  )
}

function activityTitle(str) {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (str === today) return "Today's Activity"
  if (str === yesterday) return "Yesterday's Activity"
  return new Date(str).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}
