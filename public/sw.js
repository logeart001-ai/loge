// Service Worker for Loge Arts
const CACHE_NAME = 'loge-arts-v1'
const STATIC_CACHE = 'loge-static-v1'
const DYNAMIC_CACHE = 'loge-dynamic-v1'

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/art',
  '/creators',
  '/events',
  '/blog',
  '/image/logelogo.png',
  '/image/AncestralEchoes.jpg',
  '/image/urbanRythym.jpg',
  '/image/Mother Earth.jpg',
  '/manifest.json'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker: Static assets cached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip external requests
  if (url.origin !== location.origin) return

  // Handle different types of requests
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request))
  } else if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request))
  } else {
    event.respondWith(handlePageRequest(request))
  }
})

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Fetch from network
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('Service Worker: Image request failed', error)
    // Return a fallback image if available
    return caches.match('/image/placeholder.svg') || new Response('Image not available', { status: 404 })
  }
}

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
  try {
    // Try network first for fresh data
    const networkResponse = await fetch(request)
    
    // Cache successful GET responses
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('Service Worker: API request failed', error)
    
    // Fallback to cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request)
      if (cachedResponse) {
        return cachedResponse
      }
    }
    
    // Return error response
    return new Response(JSON.stringify({ error: 'Network unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Handle page requests with cache-first strategy for static pages
async function handlePageRequest(request) {
  try {
    // For static pages, try cache first
    if (isStaticPage(request.url)) {
      const cachedResponse = await caches.match(request)
      if (cachedResponse) {
        return cachedResponse
      }
    }

    // Fetch from network
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('Service Worker: Page request failed', error)
    
    // Try to serve from cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Fallback to offline page
    return caches.match('/') || new Response('Page not available offline', { status: 404 })
  }
}

// Check if a page is static (can be cached longer)
function isStaticPage(url) {
  const staticPaths = ['/', '/art', '/creators', '/events', '/blog']
  const pathname = new URL(url).pathname
  return staticPaths.includes(pathname) || pathname.startsWith('/image/')
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  console.log('Service Worker: Background sync triggered')
  // Implement background sync logic here
  // For example, retry failed API requests
}

// Push notifications (if needed in the future)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/image/logelogo.png',
      badge: '/image/logelogo.png',
      data: data.url
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.notification.data) {
    event.waitUntil(
      clients.openWindow(event.notification.data)
    )
  }
})