import { useNavigate } from 'react-router-dom'
import styles from './PageHeader.module.css'

function IconBack() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  )
}

export default function PageHeader({ title, icon: Icon, showBack = false, onBack }) {
  const navigate = useNavigate()

  function handleBack() {
    if (onBack) onBack()
    else navigate(-1)
  }

  return (
    <header className={styles.header}>
      {showBack ? (
        <button className={styles.backBtn} onClick={handleBack} aria-label="Go back">
          <IconBack />
        </button>
      ) : (
        <div className={styles.iconWrap}>
          {Icon && <Icon />}
        </div>
      )}
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.spacer} />
    </header>
  )
}
