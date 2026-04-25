import { Link } from 'react-router-dom'
import { localDateStr, localYesterdayStr } from '../../utils/dates'
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
          selectedDate === localDateStr()
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
  const today = localDateStr()
  const yesterday = localYesterdayStr()
  if (str === today) return "Today's Activity"
  if (str === yesterday) return "Yesterday's Activity"
  return new Date(str).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}
