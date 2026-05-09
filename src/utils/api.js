export const API_BASE = import.meta.env.VITE_API_URL || '/api'

export function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('request-timeout')), timeoutMs)
    ),
  ])
}

export function apiFetch(input, init) {
  return fetch(input, init).then(res => {
    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent('caltrack:unauthorized'))
    }
    return res
  })
}
