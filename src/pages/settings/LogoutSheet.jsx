import Sheet from './Sheet'
import sheetStyles from './Sheet.module.css'

export default function LogoutSheet({ onClose, onLogout }) {
  return (
    <Sheet onClose={onClose} title="Log Out?">
      <div className={sheetStyles.pad}>
        <p className={sheetStyles.sub}>You'll need to sign in again to access your data.</p>
        <button className={sheetStyles.dangerBtn} onClick={onLogout}>Log Out</button>
      </div>
    </Sheet>
  )
}
