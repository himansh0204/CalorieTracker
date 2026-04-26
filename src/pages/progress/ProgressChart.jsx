import styles from './progress.module.css'

const FAT_COLOR     = '#60a5fa'
const CARBS_COLOR   = '#34d399'
const PROTEIN_COLOR = '#fb923c'

const FAT_GRADIENT     = 'linear-gradient(180deg, #93c5fd 0%, #2563eb 100%)'
const CARBS_GRADIENT   = 'linear-gradient(180deg, #6ee7b7 0%, #059669 100%)'
const PROTEIN_GRADIENT = 'linear-gradient(180deg, #fdba74 0%, #ea580c 100%)'
const CHART_H = 130
const GRID_COUNT = 4

function calcCeiling(days) {
  const max = Math.max(...days.map(d => d.protein * 4 + d.carbs * 4 + d.fat * 9), 200)
  return Math.ceil(max / 500) * 500
}

export function groupIntoWeeks(days) {
  const weeks = []
  let weekNum = 0
  let current = null
  for (const day of days) {
    const dow = new Date(day.date + 'T12:00:00').getDay()
    if (current === null || dow === 1) {
      weekNum++
      current = { date: day.date, label: `W${weekNum}`, calories: 0, protein: 0, carbs: 0, fat: 0 }
      weeks.push(current)
    }
    current.calories += day.calories
    current.protein  += day.protein
    current.carbs    += day.carbs
    current.fat      += day.fat
  }
  return weeks
}

export { FAT_COLOR, CARBS_COLOR, PROTEIN_COLOR }

export default function ProgressChart({ days }) {
  const ceiling = calcCeiling(days)
  const gridStep = ceiling / GRID_COUNT

  return (
    <div className={styles.chartContainer}>
      <div className={styles.yAxis}>
        {Array.from({ length: GRID_COUNT + 1 }, (_, i) => GRID_COUNT - i).map(i => (
          <span key={i} className={styles.yLabel}>
            {Math.round(i * gridStep).toLocaleString()}
          </span>
        ))}
      </div>

      <div className={styles.chartBody}>
        <div className={styles.barsArea} style={{ height: CHART_H }}>
          {Array.from({ length: GRID_COUNT }, (_, i) => (
            <div
              key={i}
              className={styles.gridLine}
              style={{ bottom: `${((i + 1) / GRID_COUNT) * 100}%` }}
            />
          ))}
          <div className={styles.zeroLine} />

          <div className={styles.barsRow}>
            {days.map(d => {
              const fatCal     = d.fat * 9
              const carbCal    = d.carbs * 4
              const proteinCal = d.protein * 4
              const total      = fatCal + carbCal + proteinCal
              const barH       = Math.max(0, Math.round((total / ceiling) * CHART_H))

              return (
                <div key={d.date} className={styles.barCol}>
                  {total > 0 ? (
                    <div
                      className={styles.bar}
                      style={{ height: barH }}
                    >
                      <div style={{ flex: fatCal,     background: FAT_GRADIENT,     borderRadius: '6px 6px 0 0' }} />
                      <div style={{ flex: carbCal,    background: CARBS_GRADIENT }} />
                      <div style={{ flex: proteinCal, background: PROTEIN_GRADIENT, borderRadius: '0 0 2px 2px' }} />
                    </div>
                  ) : (
                    <div className={styles.barEmpty} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className={styles.xAxis}>
          {days.map(d => (
            <span key={d.date} className={styles.xLabel}>{d.label}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
