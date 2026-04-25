import { useRef, useEffect } from 'react'
import { useWeekCalories } from './useWeekCalories'
import { localDateStr } from '../../utils/dates'
import styles from './home.module.css'

const NUM_WEEKS = 2
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function getMondayMs(dateStr) {
  const d = new Date(dateStr)
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff)
}

function weekPageOf(dateStr) {
  const todayStr = localDateStr()
  const currentMondayMs = getMondayMs(todayStr)
  const targetMondayMs = getMondayMs(dateStr)
  const weekDiff = Math.round((currentMondayMs - targetMondayMs) / (7 * 86400000))
  return (NUM_WEEKS - 1) - weekDiff
}

export default function WeekStrip({ calorieGoal, mealsVersion, selectedDate, setSelectedDate }) {
  const calMap = useWeekCalories(mealsVersion)
  const todayStr = localDateStr()
  const stripRef = useRef(null)
  const mountedRef = useRef(false)

  const currentMondayMs = getMondayMs(todayStr)
  const weeks = Array.from({ length: NUM_WEEKS }, (_, wi) => {
    const mondayMs = currentMondayMs - (NUM_WEEKS - 1 - wi) * 7 * 86400000
    return {
      days: Array.from({ length: 7 }, (_, di) => {
        const d = new Date(mondayMs + di * 86400000)
        const dateStr = d.toISOString().slice(0, 10)
        const calories = calMap.get(dateStr)
        const isLogged = calories !== undefined
        const isOver = isLogged && calorieGoal > 0 && calories > calorieGoal
        return {
          dayLabel: DAY_LABELS[di],
          date: d.getUTCDate(),
          dateStr,
          isToday: dateStr === todayStr,
          isFuture: dateStr > todayStr,
          isSelected: dateStr === selectedDate,
          isLogged,
          isOver,
        }
      }),
    }
  })

  useEffect(() => {
    if (!stripRef.current) return
    const idx = weekPageOf(selectedDate)
    if (idx < 0 || idx >= NUM_WEEKS) return
    stripRef.current.scrollTo({
      left: stripRef.current.clientWidth * idx,
      behavior: mountedRef.current ? 'smooth' : 'instant',
    })
    mountedRef.current = true
  }, [selectedDate])

  return (
    <div className={styles.weekStrip} ref={stripRef}>
      {weeks.map((week, wi) => (
        <div key={wi} className={styles.weekPage}>
          <div className={styles.weekDays}>
            {week.days.map(({ dayLabel, date, dateStr, isToday, isFuture, isSelected, isLogged, isOver }) => (
              <button
                key={dateStr}
                className={`${styles.weekDay} ${isFuture ? styles.weekDayFuture : ''}`}
                onClick={() => !isFuture && setSelectedDate(dateStr)}
                disabled={isFuture}
              >
                <span className={styles.weekDayLabel}>{dayLabel}</span>
                <div className={[
                  styles.weekCircle,
                  isSelected && isOver                 ? styles.weekSelectedOver : '',
                  isSelected && !isOver                ? styles.weekSelected     : '',
                  !isSelected && isToday && !isLogged  ? styles.weekToday        : '',
                  !isSelected && isLogged && !isOver   ? styles.weekLogged       : '',
                  !isSelected && isLogged && isOver    ? styles.weekOver         : '',
                ].filter(Boolean).join(' ')}>
                  <span className={styles.weekNum}>{date}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
