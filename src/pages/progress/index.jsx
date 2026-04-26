import { useState, useEffect } from 'react'
import EmptyMealState from '../../components/EmptyMealState'
import { useTotalMeals } from '../../hooks/useTotalMeals'
import ProgressChart, { groupIntoWeeks, FAT_COLOR, CARBS_COLOR } from './ProgressChart'
import BMICard from './BMICard'
import CalendarCard from './CalendarCard'
import WeeklyReportSheet from '../home/WeeklyReportSheet'
import styles from './progress.module.css'
import { CalorieIcon, ProteinIcon, CarbsIcon, FatIcon } from '../../components/NutrientIcons'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const PERIODS = [
  { key: 'week',      label: 'Week' },
  { key: 'last-week', label: 'Last Week' },
  { key: 'month',     label: 'Month' },
]

export default function Progress() {
  const totalMeals = useTotalMeals()
  const [period, setPeriod]       = useState('week')
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [reportState, setReportState] = useState('closed')
  const [reportText, setReportText]   = useState('')

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

  const PERIOD_LABELS = { week: 'Week Report', 'last-week': 'Last Week Report', month: 'Month Report' }

  async function openReport() {
    setReportState('loading')
    try {
      const res = await fetch(`${API_BASE}/analytics/weekly-report?period=${period}`, {
        credentials: 'include',
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Failed to generate report')
      setReportText(json.report)
      setReportState('open')
    } catch {
      setReportState('error')
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Progress</h1>

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
              <div className={styles.chartHeadRow}>
                <p className={styles.sectionHeading}>Nutrition Analytics</p>
                <button className={styles.reportBtn} onClick={openReport}>✨ AI Insights</button>
              </div>
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
                <span className={styles.fireIcon}><CalorieIcon /></span>
                <span className={styles.totalKcal}>{data.totalCalories.toLocaleString()}</span>
                <span className={styles.kcalLabel}>kcal</span>
              </div>
              <ProgressChart days={chartDays} />
              <div className={styles.legend}>
                <div className={styles.legendItem}>
                  <span className={styles.legendIcon} style={{ color: '#fb923c' }}><ProteinIcon size={14} /></span>
                  <span className={styles.legendLabel}>Protein</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendIcon} style={{ color: CARBS_COLOR }}><CarbsIcon size={14} /></span>
                  <span className={styles.legendLabel}>Carbs</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendIcon} style={{ color: FAT_COLOR }}><FatIcon size={14} /></span>
                  <span className={styles.legendLabel}>Fat</span>
                </div>
              </div>
            </div>

            <CalendarCard />
            <BMICard />
          </div>
        </>
      ) : null}

      <WeeklyReportSheet
        state={reportState}
        text={reportText}
        title={PERIOD_LABELS[period]}
        onClose={() => setReportState('closed')}
        onRetry={openReport}
      />
    </div>
  )
}
