import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

const DEFAULTS = { calorieGoal: 2000, proteinGoal: 150, carbsGoal: 250, fatGoal: 65 }
const SETTINGS_TIMEOUT_MS = 7000
const LOCAL_KEY_PREFIX = 'caltrack.settings'
const SETTINGS_UPDATED_EVENT = 'caltrack:settings-updated'
const API_BASE = import.meta.env.VITE_API_URL || '/api'

export function useSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState(DEFAULTS)
  const [loading, setLoading] = useState(false)
  const key = localKey(user?.id)

  const fetchSettings = useCallback(async () => {
    const local = readLocalSettings(key)
    if (local) setSettings(local)

    if (!user) {
      if (!local) setSettings(DEFAULTS)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await withTimeout(
        fetch(`${API_BASE}/settings`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        SETTINGS_TIMEOUT_MS
      )

      if (!response.ok) throw new Error('Failed to fetch settings')
      const data = await response.json()
      
      if (data.settings) {
        const merged = sanitizeSettings({ ...DEFAULTS, ...data.settings })
        setSettings(merged)
        writeLocalSettings(key, merged)
      }
    } catch {
      // Keep defaults if API is slow/unavailable to avoid blocking navigation.
      setSettings((prev) => sanitizeSettings({ ...DEFAULTS, ...prev }))
    } finally {
      setLoading(false)
    }
  }, [user, key])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  useEffect(() => {
    function onSettingsUpdated(e) {
      const detail = e.detail || {}
      if (detail.key !== key || !detail.settings) return
      setSettings(sanitizeSettings(detail.settings))
    }

    function onStorage(e) {
      if (e.key !== key || !e.newValue) return
      try {
        const parsed = sanitizeSettings(JSON.parse(e.newValue))
        setSettings(parsed)
      } catch {
        // Ignore malformed storage payloads.
      }
    }

    window.addEventListener(SETTINGS_UPDATED_EVENT, onSettingsUpdated)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(SETTINGS_UPDATED_EVENT, onSettingsUpdated)
      window.removeEventListener('storage', onStorage)
    }
  }, [key])

  async function updateSettings(updates) {
    const next = sanitizeSettings({ ...settings, ...updates })
    setSettings(next)
    writeLocalSettings(key, next)

    if (!user) return { ok: true, remote: false }

    try {
      const token = localStorage.getItem('authToken')
      const response = await withTimeout(
        fetch(`${API_BASE}/settings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(next),
        }),
        SETTINGS_TIMEOUT_MS
      )

      if (!response.ok) throw new Error('Failed to update settings')
      return { ok: true, remote: true }
    } catch {
      // Saved locally, but remote sync failed.
      return { ok: false, remote: false }
    }
  }

  return { settings, loading, updateSettings }
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('settings-timeout')), timeoutMs)
    }),
  ])
}

function sanitizeSettings(raw) {
  return {
    calorieGoal: toGoal(raw.calorieGoal, DEFAULTS.calorieGoal),
    proteinGoal: toGoal(raw.proteinGoal, DEFAULTS.proteinGoal),
    carbsGoal: toGoal(raw.carbsGoal, DEFAULTS.carbsGoal),
    fatGoal: toGoal(raw.fatGoal, DEFAULTS.fatGoal),
  }
}

function toGoal(value, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return fallback
  return Math.round(n)
}

function localKey(uid) {
  return uid ? `${LOCAL_KEY_PREFIX}.${uid}` : `${LOCAL_KEY_PREFIX}.guest`
}

function readLocalSettings(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return sanitizeSettings(JSON.parse(raw))
  } catch {
    return null
  }
}

function writeLocalSettings(key, settings) {
  try {
    localStorage.setItem(key, JSON.stringify(settings))
    window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT, {
      detail: { key, settings },
    }))
  } catch {
    // Ignore storage write failures.
  }
}
