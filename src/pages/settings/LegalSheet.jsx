import Sheet from './Sheet'
import sheetStyles from './Sheet.module.css'
import styles from './LegalSheet.module.css'

const PRIVACY_CONTENT = (
  <div className={styles.content}>
    <p className={styles.date}>Last updated: April 2026</p>
    <p className={styles.heading}>Information We Collect</p>
    <p className={styles.text}>We collect the information you provide when creating an account (name, email via Google Sign-In) and the data you log within the app (meals, calories, body stats).</p>
    <p className={styles.heading}>How We Use Your Data</p>
    <p className={styles.text}>Your data is used solely to provide and improve the CalQube service — calculating nutrition goals, displaying your history, and generating insights. We do not sell your personal data to third parties.</p>
    <p className={styles.heading}>Data Storage</p>
    <p className={styles.text}>Your data is stored securely on our servers. We use industry-standard encryption for data in transit and at rest.</p>
    <p className={styles.heading}>Data Deletion</p>
    <p className={styles.text}>You can permanently delete your account and all associated data at any time from Settings → Delete Account. Deletion is immediate and irreversible.</p>
    <p className={styles.heading}>Contact</p>
    <p className={styles.text}>For privacy-related questions, contact us at calqube.support@gmail.com.</p>
  </div>
)

const TERMS_CONTENT = (
  <div className={styles.content}>
    <p className={styles.date}>Last updated: April 2026</p>
    <p className={styles.heading}>Acceptance</p>
    <p className={styles.text}>By using CalQube you agree to these terms. If you do not agree, please do not use the app.</p>
    <p className={styles.heading}>Use of the App</p>
    <p className={styles.text}>CalQube is a personal nutrition tracking tool intended for general wellness purposes only. It is not a substitute for professional medical or dietary advice. Always consult a qualified healthcare provider before making significant changes to your diet.</p>
    <p className={styles.heading}>Account Responsibility</p>
    <p className={styles.text}>You are responsible for maintaining the security of your account. You may not use CalQube for any unlawful purpose or in violation of any applicable regulations.</p>
    <p className={styles.heading}>Accuracy of Information</p>
    <p className={styles.text}>Calorie and nutrient data provided by the app is estimated and may not be perfectly accurate. CalQube makes no warranties about the completeness or accuracy of nutritional information.</p>
    <p className={styles.heading}>Changes to Terms</p>
    <p className={styles.text}>We may update these terms at any time. Continued use of the app after changes constitutes acceptance of the revised terms.</p>
    <p className={styles.heading}>Contact</p>
    <p className={styles.text}>Questions about these terms? Email calqube.support@gmail.com.</p>
  </div>
)

export default function LegalSheet({ onClose, type }) {
  const isPrivacy = type === 'privacy'
  return (
    <Sheet onClose={onClose} title={isPrivacy ? 'Privacy Policy' : 'Terms of Use'}>
      <div className={sheetStyles.pad}>
        {isPrivacy ? PRIVACY_CONTENT : TERMS_CONTENT}
      </div>
    </Sheet>
  )
}
