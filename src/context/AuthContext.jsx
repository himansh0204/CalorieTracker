import { createContext, useContext, useEffect, useRef, useState } from 'react'

const AuthContext = createContext(null)
const API_BASE = import.meta.env.VITE_API_URL || '/api'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const initialised = useRef(false)

  // Validate session on mount via cookie
  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.ok) setUser(data.user)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleCredential(idToken) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken }),
      })
      if (!res.ok) throw new Error('Backend auth failed')
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Authentication failed')
      setUser(data.user)
    } catch (err) {
      console.error('Auth error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function getGoogleButtonRenderer() {
    return (containerEl) => {
      if (!window.google || !containerEl) return
      if (!initialised.current) {
        google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: (resp) => resp.credential && handleCredential(resp.credential),
          cancel_on_tap_outside: false,
        })
        initialised.current = true
      }
      google.accounts.id.renderButton(containerEl, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text: 'signin_with',
        width: containerEl.offsetWidth || 300,
      })
    }
  }

  async function logout() {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {})
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, getGoogleButtonRenderer, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
