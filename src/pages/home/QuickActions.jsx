import { Link } from 'react-router-dom'
import styles from './home.module.css'

export default function QuickActions({ onReportClick }) {
  return (
    <section className={styles.quickActions}>
      <Link to="/scanner" className={styles.primaryAction}>
        <span className={styles.primaryActionIcon}>📷</span>
        <div className={styles.primaryActionText}>
          <span className={styles.primaryActionTitle}>Scan Food</span>
          <span className={styles.primaryActionSub}>AI estimates nutrition instantly</span>
        </div>
      </Link>
      <div className={styles.secondaryActions}>
        <Link to="/history" className={styles.secondaryAction}>
          <span className={styles.secondaryActionTitle}>View History</span>
        </Link>
        <button className={styles.secondaryAction} onClick={onReportClick}>
          <span className={styles.secondaryActionTitle}>Weekly Report</span>
        </button>
      </div>
    </section>
  )
}
