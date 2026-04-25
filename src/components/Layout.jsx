import { Outlet, NavLink } from 'react-router-dom'
import { IconHome, IconAdd, IconProgress, IconHistory, IconSettings } from './icons'
import styles from './Layout.module.css'

const navItems = [
  { to: '/', label: 'Home', icon: IconHome, end: true },
  { to: '/progress', label: 'Progress', icon: IconProgress },
  { to: '/scanner', label: 'Scan Food', icon: IconAdd, primary: true },
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
        {navItems.map(({ to, label, icon: Icon, end, primary }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `${styles.navItem} ${primary ? styles.navPrimary : ''} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon}><Icon /></span>
            <span className={styles.navLabel}>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
