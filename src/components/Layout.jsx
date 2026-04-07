import { Outlet, NavLink } from 'react-router-dom'
import styles from './Layout.module.css'

const navItems = [
  { to: '/', label: 'Home', short: 'HM', end: true },
  { to: '/scanner', label: 'Add Meal', short: 'ADD' },
  { to: '/progress', label: 'Progress', short: 'PR' },
  { to: '/history', label: 'History', short: 'HS' },
  { to: '/settings', label: 'Settings', short: 'ST' },
]

export default function Layout() {
  return (
    <div className={styles.shell}>
      <main className={styles.main}>
        <Outlet />
      </main>
      <nav className={styles.nav}>
        {navItems.map(({ to, label, short, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon}>{short}</span>
            <span className={styles.navLabel}>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
