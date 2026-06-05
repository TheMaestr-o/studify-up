const CACHE_NAME = 'studify-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // Ignore errors for optional assets
      })
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip API requests and external URLs
  if (url.hostname !== self.location.hostname || url.pathname.startsWith('/api')) {
    return
  }

  // For navigation requests, try network first, fall back to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone)
          })
          return res
        })
        .catch(() => {
          return caches.match(request).then((res) => {
            return res || caches.match('/index.html')
          })
        })
    )
    return
  }

  // For other requests, cache first, then network
  event.respondWith(
    caches.match(request).then((res) => {
      if (res) return res
      return fetch(request)
        .then((networkRes) => {
          const clone = networkRes.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone)
          })
          return networkRes
        })
        .catch(() => {
          return new Response('Offline', { status: 503 })
        })
    })
  )
})
