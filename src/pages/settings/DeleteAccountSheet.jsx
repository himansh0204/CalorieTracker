import { useState } from 'react'
import Sheet from './Sheet'
import sheetStyles from './Sheet.module.css'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export default function DeleteAccountSheet({ onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError]       = useState(null)

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/auth/account`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error()
      onDeleted()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Sheet onClose={() => !deleting && onClose()} title="Delete Account?">
      <div className={sheetStyles.pad}>
        <p className={sheetStyles.sub}>
          This will permanently delete your account and all your data including meals, goals, and history. This cannot be undone.
        </p>
        {error && <p className={sheetStyles.errorMsg}>{error}</p>}
        <button className={sheetStyles.dangerBtn} onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Delete Account'}
        </button>
      </div>
    </Sheet>
  )
}
