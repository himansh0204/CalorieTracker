import styles from './home.module.css'

export default function WeeklyReportSheet({ state, text, onClose, onRetry }) {
  if (state === 'closed') return null

  return (
    <div className={styles.sheetBackdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.sheetHandle} />
        <div className={styles.sheetHeader}>
          <h2 className={styles.sheetTitle}>✨ Weekly Report</h2>
          <button className={styles.sheetClose} onClick={onClose}>✕</button>
        </div>

        {state === 'loading' && (
          <div className={styles.sheetLoading}>
            <div className={styles.sheetSpinner} />
            <p>Analysing your week…</p>
          </div>
        )}

        {state === 'error' && (
          <div className={styles.sheetLoading}>
            <p>Failed to generate report. Try again.</p>
            <button className={styles.retryBtn} onClick={onRetry}>Retry</button>
          </div>
        )}

        {state === 'open' && (
          <div className={styles.sheetBody}>
            {text.split('\n').map((line, i) => {
              if (line.startsWith('## ')) return <h3 key={i} className={styles.reportSection}>{line.slice(3)}</h3>
              if (line.startsWith('- ') || line.startsWith('• ')) return <p key={i} className={styles.reportBullet}>{line.slice(2)}</p>
              if (line.trim() === '') return null
              return <p key={i} className={styles.reportPara}>{line}</p>
            })}
          </div>
        )}
      </div>
    </div>
  )
}
