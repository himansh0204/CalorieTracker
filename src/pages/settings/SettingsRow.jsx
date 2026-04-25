import { Chevron } from './SettingsIcons'
import styles from './settings.module.css'

export function Row({ icon, label, value, onClick, danger }) {
  return (
    <button className={`${styles.row} ${danger ? styles.rowDanger : ''}`} onClick={onClick}>
      <span className={styles.rowIcon}>{icon}</span>
      <span className={styles.rowLabel}>{label}</span>
      {value && <span className={styles.rowValue}>{value}</span>}
      <span className={styles.rowChevron}><Chevron /></span>
    </button>
  )
}
