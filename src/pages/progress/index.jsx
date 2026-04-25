import { useState, useEffect } from 'react'
import PageHeader from '../../components/PageHeader'
import EmptyMealState from '../../components/EmptyMealState'
import { useTotalMeals } from '../../hooks/useTotalMeals'
import { IconProgress } from '../../components/icons'
import ProgressChart, { groupIntoWeeks, FAT_COLOR, CARBS_COLOR, PROTEIN_COLOR } from './ProgressChart'
import BMICard from './BMICard'
import CalendarCard from './CalendarCard'
import styles from './progress.module.css'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const PERIODS = [
  { key: 'week',      label: 'Week' },
  { key: 'last-week', label: 'Last Week' },
  { key: 'month',     label: 'Month' },
]

export default function Progress() {
  const totalMeals = useTotalMeals()
  const [period, setPeriod]     = useState('week')
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${API_BASE}/analytics/progress?period=${period}`, {
          credentials: 'include',
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
  const noData = totalMeals === 0

  return (
    <div className={styles.page}>
      <PageHeader title="Progress" icon={IconProgress} />

      {loading ? (
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
        </div>
      ) : error ? (
        <div className={styles.errorWrap}>
          <p className={styles.errorMsg}>⚠️ {error}</p>
          <button className={styles.retryBtn} onClick={() => setPeriod(p => p)}>Retry</button>
        </div>
      ) : noData ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '16px' }}>
          <EmptyMealState />
        </div>
      ) : data ? (
        <>
          <div className={styles.content}>
            <div className={styles.chartCard}>
              <p className={styles.sectionHeading}>Nutrition Analytics</p>
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
              <div className={styles.totalRow}>
                <span className={styles.fireIcon}>🔥</span>
                <span className={styles.totalKcal}>{data.totalCalories.toLocaleString()}</span>
                <span className={styles.kcalLabel}>kcal</span>
              </div>
              <ProgressChart days={chartDays} />
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
            </div>

            <CalendarCard />
            <BMICard />
          </div>
        </>
      ) : null}
    </div>
  )
}
