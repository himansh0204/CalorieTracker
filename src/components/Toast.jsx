import styles from './Toast.module.css'

const ICONS = { success: '✓', error: '!', info: '↩' }

export default function Toast({ toasts, onDismiss }) {
  if (!toasts.length) return null

  return (
    <div className={styles.container}>
      {toasts.map(t => (
        <div
          key={t.id}
          className={[
            styles.toast,
            styles[t.type] || styles.success,
            t.exiting ? styles.exiting : '',
          ].filter(Boolean).join(' ')}
        >
          <span className={styles.icon}>{ICONS[t.type] || ICONS.success}</span>
          <span className={styles.msg}>{t.message}</span>
          <div className={styles.actions}>
            {t.undoFn && (
              <button
                className={styles.undoBtn}
                onClick={() => { t.undoFn(); onDismiss(t.id) }}
              >
                Undo
              </button>
            )}
            <button className={styles.closeBtn} onClick={() => onDismiss(t.id)}>×</button>
          </div>
        </div>
      ))}
    </div>
  )
}
