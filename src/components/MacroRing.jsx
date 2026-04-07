import styles from './MacroRing.module.css'

export default function MacroRing({ label, value, goal, color, unit = 'g' }) {
  const pct = Math.min(100, goal > 0 ? Math.round((value / goal) * 100) : 0)
  const radius = 22
  const circ = 2 * Math.PI * radius
  const dash = (pct / 100) * circ

  return (
    <div className={styles.wrap}>
      <svg width="60" height="60" viewBox="0 0 60 60" aria-label={`${label}: ${Math.round(value)}${unit}`}>
        <circle cx="30" cy="30" r={radius} fill="none" stroke="var(--ring-bg, #e5e7eb)" strokeWidth="5" />
        <circle
          cx="30" cy="30" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 30 30)"
        />
      </svg>
      <div className={styles.info}>
        <span className={styles.value} style={{ color }}>{Math.round(value)}</span>
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  )
}
