import { createContext, useContext, useEffect, useRef, useState } from 'react'

const AuthContext = createContext(null)
const API_BASE = import.meta.env.VITE_API_URL || '/api'

// Called from Login page once the google script has loaded
export let initGoogleSignIn = null

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const initialised = useRef(false)

  // Load persisted session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken')
    const savedUser = localStorage.getItem('authUser')
    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('authToken')
        localStorage.removeItem('authUser')
      }
    }
    setLoading(false)
  }, [])

  async function handleCredential(idToken) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })
      if (!res.ok) throw new Error('Backend auth failed')
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Authentication failed')
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('authUser', JSON.stringify(data.user))
      setUser(data.user)
    } catch (err) {
      console.error('Auth error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Returns a function that, given a container div, renders Google's official button.
  // Login.jsx calls this once the GSI script is ready.
  function getGoogleButtonRenderer() {
    return (containerEl) => {
      if (!window.google || !containerEl) return
      if (!initialised.current) {
        google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: (resp) => resp.credential && handleCredential(resp.credential),
          // Disable One Tap – we use the explicit button only
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

  function logout() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
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
