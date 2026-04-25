import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import styles from './Login.module.css'

export default function Login() {
  const { user, loading, error, getGoogleButtonRenderer } = useAuth()
  const btnRef = useRef(null)
  const [scriptReady, setScriptReady] = useState(!!window.google)

  // Wait for the Google GSI script to load, then render the button
  useEffect(() => {
    if (window.google) {
      setScriptReady(true)
      return
    }
    // Script is async – poll until ready (max 5s)
    const id = setInterval(() => {
      if (window.google) {
        setScriptReady(true)
        clearInterval(id)
      }
    }, 100)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!scriptReady || !btnRef.current) return
    const render = getGoogleButtonRenderer()
    render(btnRef.current)
  }, [scriptReady, getGoogleButtonRenderer])

  if (user) return <Navigate to="/" replace />

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <img src="/logo.png" alt="CalQube" className={styles.logo} />
        <h1 className={styles.title}>CalQube</h1>
        <p className={styles.subtitle}>Your AI-powered nutrition companion</p>

        <ul className={styles.features}>
          <li><span>📷</span><span>Snap photo — AI estimates nutrition</span></li>
          <li><span>🔥</span><span>Track calories &amp; macros daily</span></li>
          <li><span>📈</span><span>Weekly AI nutrition report</span></li>
          <li><span>📅</span><span>30-day meal history</span></li>
        </ul>

        {error && <p className={styles.errorMsg}>{error}</p>}

        {/* Google renders its own styled button into this div */}
        <div ref={btnRef} className={styles.googleBtnWrapper} />

        {loading && <p className={styles.signingIn}>Signing in…</p>}
        {!scriptReady && <p className={styles.signingIn}>Loading Google Sign-In…</p>}
      </div>
    </div>
  )
}
