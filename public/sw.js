const CACHE = 'caltrack-v2'
const PRECACHE = ['/', '/index.html']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return

  if (e.request.mode === 'navigate') {
    e.respondWith(networkFirstHtml(e.request))
    return
  }

  const url = new URL(e.request.url)
  // Don't cache Firebase / API calls
  if (url.hostname.includes('firebase') || url.hostname.includes('openfoodfacts')) return

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fresh = fetch(e.request).then((res) => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, clone))
        }
        return res
      })
      return cached || fresh
    })
  )
})

async function networkFirstHtml(request) {
  try {
    const response = await promiseTimeout(fetch(request), 4000)
    if (response && response.ok) {
      const cache = await caches.open(CACHE)
      cache.put('/index.html', response.clone())
      return response
    }
  } catch {
    // Fall back to cache below.
  }

  const cached = await caches.match('/index.html')
  if (cached) return cached

  return new Response('Offline', {
    status: 503,
    headers: { 'Content-Type': 'text/plain' },
  })
}

function promiseTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
  ])
}
