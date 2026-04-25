import { Link } from 'react-router-dom'
import styles from './EmptyMealState.module.css'

export default function EmptyMealState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
          <line x1="6" y1="1" x2="6" y2="4"/>
          <line x1="10" y1="1" x2="10" y2="4"/>
          <line x1="14" y1="1" x2="14" y2="4"/>
        </svg>
      </div>
      <p className={styles.title}>No meals logged yet</p>
      <p className={styles.subtitle}>Start tracking to hit your daily goals</p>
      <Link to="/scanner" className={styles.addBtn}>
        <span className={styles.plus}>+</span> Add a meal
      </Link>
    </div>
  )
}
