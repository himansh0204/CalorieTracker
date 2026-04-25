import { useSettings } from '../../hooks/useSettings'
import styles from './progress.module.css'

const CATEGORIES = [
  { label: 'Underweight', max: 18.5, color: '#60a5fa' },
  { label: 'Healthy',     max: 25,   color: '#34d399' },
  { label: 'Overweight',  max: 30,   color: '#fbbf24' },
  { label: 'Obese',       max: Infinity, color: '#f87171' },
]

function getCategory(bmi) {
  return CATEGORIES.find(c => bmi < c.max)
}

// Map BMI 10–40 → 0–100%
function bmiToPercent(bmi) {
  return Math.min(100, Math.max(0, ((bmi - 10) / 30) * 100))
}

export default function BMICard() {
  const { settings } = useSettings()
  const { weightKg, heightCm } = settings

  if (!weightKg || !heightCm) return null

  const heightM = heightCm / 100
  const bmi = weightKg / (heightM * heightM)
  const bmiRounded = Math.round(bmi * 10) / 10
  const cat = getCategory(bmi)
  const pct = bmiToPercent(bmi)

  return (
    <div className={styles.bmiCard}>
      <p className={styles.sectionHeading}>Your BMI</p>
      <div className={styles.bmiTop}>
        <div>
          <p className={styles.bmiNumber}>{bmiRounded}</p>
        </div>
        <div className={styles.bmiRight}>
          <p className={styles.bmiWeightText}>Your weight is</p>
          <span className={styles.bmiPill} style={{ background: cat.color + '22', color: cat.color, border: `1px solid ${cat.color}55` }}>
            {cat.label}
          </span>
        </div>
      </div>

      <div className={styles.bmiBarWrap}>
        <div className={styles.bmiBar} />
        <div className={styles.bmiMarker} style={{ left: `${pct}%` }} />
      </div>

      <div className={styles.bmiLegend}>
        {CATEGORIES.map(c => (
          <div key={c.label} className={styles.bmiLegendItem}>
            <span className={styles.bmiLegendDot} style={{ background: c.color }} />
            <span className={styles.bmiLegendLabel}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
