import { Link } from 'react-router-dom'
import styles from './home.module.css'

export default function QuickActions({ onReportClick }) {
  return (
    <section className={styles.quickActions}>
      <Link to="/scanner" className={styles.actionCard}>
        <span className={styles.actionTitle}>Add Meal</span>
        <span className={styles.actionSub}>Snap the photo</span>
      </Link>
      <Link to="/history" className={styles.actionCard}>
        <span className={styles.actionTitle}>View History</span>
        <span className={styles.actionSub}>Track your streak</span>
      </Link>
      <button className={`${styles.actionCard} ${styles.reportCard}`} onClick={onReportClick}>
        <span className={styles.actionTitle}>Weekly Report</span>
        <span className={styles.actionSub}>AI nutrition insights</span>
      </button>
    </section>
  )
}
