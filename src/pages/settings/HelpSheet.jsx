import Sheet from './Sheet'
import sheetStyles from './Sheet.module.css'
import styles from './HelpSheet.module.css'

export default function HelpSheet({ onClose }) {
  return (
    <Sheet onClose={onClose} title="Help & Support">
      <div className={sheetStyles.pad}>
        <div className={styles.section}>
          <p className={styles.heading}>Contact Us</p>
          <p className={styles.text}>Having an issue or want to share feedback? Reach out at:</p>
          <p className={styles.email}>calqube.support@gmail.com</p>
        </div>
        <div className={styles.section}>
          <p className={styles.heading}>FAQ</p>
          <div className={styles.faqItem}>
            <p className={styles.faqQ}>How are my calorie goals calculated?</p>
            <p className={styles.faqA}>Goals use the Mifflin-St Jeor formula based on your weight, height, age, gender, and activity level.</p>
          </div>
          <div className={styles.faqItem}>
            <p className={styles.faqQ}>Can I log meals from past days?</p>
            <p className={styles.faqA}>Yes — tap any day in the week strip on the Home tab to switch to that date before logging.</p>
          </div>
          <div className={styles.faqItem}>
            <p className={styles.faqQ}>How do I update my goals?</p>
            <p className={styles.faqA}>Go to Settings → Body Stats & Goals and update your stats. Goals recalculate automatically.</p>
          </div>
        </div>
        <div className={styles.section}>
          <p className={styles.text} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>CalQube v1.0.0</p>
        </div>
      </div>
    </Sheet>
  )
}
