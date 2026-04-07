import { useState, useEffect } from 'react'
import styles from './Progress.module.css'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const PERIODS = [
  { key: 'week',      label: 'Week' },
  { key: 'last-week', label: 'Last Week' },
  { key: '2weeks',    label: '2 Wks. Ago' },
  { key: 'month',     label: 'Month' },
]

const FAT_COLOR    = '#f59e0b'
const CARBS_COLOR  = '#8b5cf6'
const PROTEIN_COLOR = '#22c55e'

const CHART_H = 160 // px — height of the bars area
const GRID_COUNT = 4

function calcCeiling(days) {
  const max = Math.max(...days.map(d => d.protein * 4 + d.carbs * 4 + d.fat * 9), 200)
  return Math.ceil(max / 500) * 500
}

function groupIntoWeeks(days) {
  const weeks = []
  let weekNum = 0
  let current = null
  for (const day of days) {
    const dow = new Date(day.date + 'T12:00:00').getDay() // 0=Sun
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

function ProgressChart({ days }) {
  const ceiling = calcCeiling(days)
  const gridStep = ceiling / GRID_COUNT

  return (
    <div className={styles.chartContainer}>
      {/* Y-axis labels */}
      <div className={styles.yAxis}>
        {Array.from({ length: GRID_COUNT + 1 }, (_, i) => GRID_COUNT - i).map(i => (
          <span key={i} className={styles.yLabel}>
            {Math.round(i * gridStep).toLocaleString()}
          </span>
        ))}
      </div>

      {/* Chart body */}
      <div className={styles.chartBody}>
        <div className={styles.barsArea} style={{ height: CHART_H }}>
          {/* Gridlines */}
          {Array.from({ length: GRID_COUNT }, (_, i) => (
            <div
              key={i}
              className={styles.gridLine}
              style={{ bottom: `${((i + 1) / GRID_COUNT) * 100}%` }}
            />
          ))}
          {/* Zero line */}
          <div className={styles.zeroLine} />

          {/* Bars */}
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
                      <div style={{ flex: fatCal,     background: FAT_COLOR,     borderRadius: fatCal > 0 && carbCal === 0 && proteinCal === 0 ? '4px 4px 0 0' : '4px 4px 0 0' }} />
                      <div style={{ flex: carbCal,    background: CARBS_COLOR }} />
                      <div style={{ flex: proteinCal, background: PROTEIN_COLOR, borderRadius: '0 0 4px 4px' }} />
                    </div>
                  ) : (
                    <div className={styles.barEmpty} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* X-axis labels */}
        <div className={styles.xAxis}>
          {days.map(d => (
            <span key={d.date} className={styles.xLabel}>{d.label}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Progress() {
  const [period, setPeriod]     = useState('week')
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const token = localStorage.getItem('authToken')
        const res = await fetch(`${API_BASE}/analytics/progress?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (!res.ok || !json.ok) throw new Error(json.error || 'Failed to load')
        setData(json)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [period])

  const chartDays = data ? (period === 'month' ? groupIntoWeeks(data.days) : data.days) : []

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Nutrition Analytics</h1>
      </header>

      {/* Period selector */}
      <div className={styles.periodRow}>
        {PERIODS.map(p => (
          <button
            key={p.key}
            className={`${styles.periodBtn} ${period === p.key ? styles.periodActive : ''}`}
            onClick={() => setPeriod(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
        </div>
      ) : error ? (
        <div className={styles.errorWrap}>
          <p className={styles.errorMsg}>⚠️ {error}</p>
          <button className={styles.retryBtn} onClick={() => setPeriod(p => p)}>Retry</button>
        </div>
      ) : data ? (
        <div className={styles.content}>
          {/* Total kcal */}
          <div className={styles.totalRow}>
            <span className={styles.fireIcon}>🔥</span>
            <span className={styles.totalKcal}>{data.totalCalories.toLocaleString()}</span>
            <span className={styles.kcalLabel}>kcal</span>
          </div>

          {/* Chart */}
          <div className={styles.chartCard}>
            <ProgressChart days={chartDays} />
          </div>

          {/* Legend */}
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: FAT_COLOR }} />
              <span className={styles.legendLabel}>Fat</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: CARBS_COLOR }} />
              <span className={styles.legendLabel}>Carbs</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: PROTEIN_COLOR }} />
              <span className={styles.legendLabel}>Protein</span>
            </div>
          </div>

          {/* Breakdown list */}
          <div className={styles.breakdownList}>
            {data.days.filter(d => d.calories > 0).map(d => (
              <div key={d.date} className={styles.breakdownRow}>
                <span className={styles.breakdownDate}>
                  {new Date(d.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <div className={styles.breakdownMacros}>
                  <span style={{ color: PROTEIN_COLOR }}>P {d.protein}g</span>
                  <span style={{ color: CARBS_COLOR }}>C {d.carbs}g</span>
                  <span style={{ color: FAT_COLOR }}>F {d.fat}g</span>
                </div>
                <span className={styles.breakdownCal}>{d.calories} kcal</span>
              </div>
            ))}
            {data.days.every(d => d.calories === 0) && (
              <p className={styles.emptyMsg}>No meals logged for this period.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
