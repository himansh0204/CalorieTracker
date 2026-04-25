import Sheet from './Sheet'
import sheetStyles from './Sheet.module.css'

export default function SyncSheet({ onClose, syncing, syncDone, onSync }) {
  return (
    <Sheet onClose={onClose} title="Sync Data">
      <div className={sheetStyles.pad}>
        <p className={sheetStyles.sub}>
          Sync pulls the latest meals and settings from the server to make sure everything is up to date.
        </p>
        {syncDone && <p className={sheetStyles.successMsg}>Data synced successfully!</p>}
        <button className={sheetStyles.primaryBtn} onClick={onSync} disabled={syncing}>
          {syncing ? 'Syncing…' : syncDone ? 'Sync Again' : 'Sync Now'}
        </button>
      </div>
    </Sheet>
  )
}
