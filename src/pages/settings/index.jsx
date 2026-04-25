import { useState, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../../hooks/useSettings'
import { useAuth } from '../../context/AuthContext'
import { useFoodLog } from '../../context/FoodLogContext'
import { Row } from './SettingsRow'
import {
  Chevron, IconBody, IconInfo, IconHistory,
  IconLogout, IconSliders, IconShield, IconSync,
  IconSupport, IconPrivacy, IconTerms, IconDelete,
} from './SettingsIcons'
import styles from './settings.module.css'

const PersonalDetailsSheet = lazy(() => import('./PersonalDetailsSheet'))
const BodyStatsSheet       = lazy(() => import('./BodyStatsSheet'))
const SyncSheet            = lazy(() => import('./SyncSheet'))
const HelpSheet            = lazy(() => import('./HelpSheet'))
const LegalSheet           = lazy(() => import('./LegalSheet'))
const LogoutSheet          = lazy(() => import('./LogoutSheet'))
const DeleteAccountSheet   = lazy(() => import('./DeleteAccountSheet'))

export default function Settings() {
  const { user, logout }    = useAuth()
  const { settings, refetch } = useSettings()
  const { fetchMeals }      = useFoodLog()
  const navigate            = useNavigate()

  const [showPersonalDetails, setShowPersonalDetails] = useState(false)
  const [showBodyStats, setShowBodyStats]             = useState(false)
  const [showSync, setShowSync]                       = useState(false)
  const [showHelp, setShowHelp]                       = useState(false)
  const [showPrivacy, setShowPrivacy]                 = useState(false)
  const [showTerms, setShowTerms]                     = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm]     = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm]     = useState(false)

  const [syncing, setSyncing]   = useState(false)
  const [syncDone, setSyncDone] = useState(false)

  const initial = user?.name?.[0]?.toUpperCase() || 'U'

  async function handleSync() {
    setSyncing(true)
    setSyncDone(false)
    try {
      await Promise.all([refetch(), fetchMeals()])
      setSyncDone(true)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Settings</h1>

      {/* Profile card */}
      <button className={styles.profileCard} onClick={() => setShowPersonalDetails(true)}>
        <div className={styles.avatarWrap}>
          {user?.picture
            ? <img src={user.picture} alt={user.name} className={styles.avatarImg} referrerPolicy="no-referrer" />
            : <span className={styles.avatarInitial}>{initial}</span>}
        </div>
        <div className={styles.profileInfo}>
          <span className={styles.profileName}>{user?.name}</span>
          <span className={styles.profileSub}>{user?.email}</span>
        </div>
        <span className={styles.profileChevron}><Chevron /></span>
      </button>

      {/* Preferences */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardHeaderIcon}><IconSliders /></span>
          <span className={styles.cardHeaderTitle}>Preferences</span>
        </div>
        <Row icon={<IconInfo />}    label="Personal Details"  onClick={() => setShowPersonalDetails(true)} />
        <div className={styles.divider} />
        <Row icon={<IconBody />}    label="Body Stats & Goals" onClick={() => setShowBodyStats(true)} />
        <div className={styles.divider} />
        <Row icon={<IconHistory />} label="Food History"      onClick={() => navigate('/history')} />
      </div>

      {/* Account */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardHeaderIcon}><IconShield /></span>
          <span className={styles.cardHeaderTitle}>Account</span>
        </div>
        <Row icon={<IconSync />}    label="Sync Data"      onClick={() => { setSyncDone(false); setShowSync(true) }} />
        <div className={styles.divider} />
        <Row icon={<IconSupport />} label="Help & Support" onClick={() => setShowHelp(true)} />
        <div className={styles.divider} />
        <Row icon={<IconPrivacy />} label="Privacy Policy" onClick={() => setShowPrivacy(true)} />
        <div className={styles.divider} />
        <Row icon={<IconTerms />}   label="Terms of Use"   onClick={() => setShowTerms(true)} />
        <div className={styles.divider} />
        <Row icon={<IconDelete />}  label="Delete Account" onClick={() => setShowDeleteConfirm(true)} danger />
      </div>

      <div className={styles.footer}>
        <button className={styles.logoutBtn} onClick={() => setShowLogoutConfirm(true)}>
          <IconLogout /> Log Out
        </button>
        <p className={styles.version}>v1.0.0</p>
      </div>

      <Suspense fallback={null}>
        {showPersonalDetails && (
          <PersonalDetailsSheet
            user={user}
            settings={settings}
            onClose={() => setShowPersonalDetails(false)}
            onEdit={() => { setShowPersonalDetails(false); setShowBodyStats(true) }}
          />
        )}

        {showBodyStats && (
          <BodyStatsSheet
            settings={settings}
            onClose={() => setShowBodyStats(false)}
            onSaved={refetch}
          />
        )}

        {showSync && (
          <SyncSheet
            onClose={() => setShowSync(false)}
            syncing={syncing}
            syncDone={syncDone}
            onSync={handleSync}
          />
        )}

        {showHelp    && <HelpSheet  onClose={() => setShowHelp(false)} />}
        {showPrivacy && <LegalSheet onClose={() => setShowPrivacy(false)} type="privacy" />}
        {showTerms   && <LegalSheet onClose={() => setShowTerms(false)}   type="terms" />}

        {showLogoutConfirm && (
          <LogoutSheet onClose={() => setShowLogoutConfirm(false)} onLogout={logout} />
        )}

        {showDeleteConfirm && (
          <DeleteAccountSheet
            onClose={() => setShowDeleteConfirm(false)}
            onDeleted={logout}
          />
        )}
      </Suspense>
    </div>
  )
}
