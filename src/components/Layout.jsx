import { Outlet, NavLink } from 'react-router-dom'
import { IconHome, IconAdd, IconProgress, IconHistory, IconSettings } from './icons'
import styles from './Layout.module.css'

const leftItems  = [
  { to: '/', label: 'Home', icon: IconHome, end: true },
  { to: '/progress', label: 'Progress', icon: IconProgress },
]
const rightItems = [
  { to: '/history', label: 'History', icon: IconHistory },
  { to: '/settings', label: 'Settings', icon: IconSettings },
]

export default function Layout() {
  return (
    <div className={styles.shell}>
      <main className={styles.main}>
        <Outlet />
      </main>
      <nav className={styles.nav}>
        {leftItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            <span className={styles.navIcon}><Icon /></span>
            <span className={styles.navLabel}>{label}</span>
          </NavLink>
        ))}

        <NavLink to="/scanner" className={({ isActive }) => `${styles.navCenter} ${isActive ? styles.navCenterActive : ''}`}>
          <IconAdd size={26} />
        </NavLink>

        {rightItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            <span className={styles.navIcon}><Icon /></span>
            <span className={styles.navLabel}>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
