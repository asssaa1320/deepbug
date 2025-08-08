/**
 * Service Worker for DeepBug Website
 * Provides caching, offline support, and performance optimization
 */

const CACHE_NAME = 'deepbug-v1.0.0';
const STATIC_CACHE_NAME = 'deepbug-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'deepbug-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
    '/',
    '/index.html',
    '/src/styles.css',
    '/src/index.js',
    '/src/components/animations.js',
    '/manifest.json',
    'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap'
];

// Files to cache on first request
const DYNAMIC_FILES = [
    '/src/utils/',
    '/src/components/',
    '/src/firebase/'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('📦 Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('✅ Static files cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Failed to cache static files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE_NAME && 
                            cacheName !== DYNAMIC_CACHE_NAME) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve cached files or fetch from network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip Firebase and external API requests
    if (url.hostname.includes('firebase') || 
        url.hostname.includes('googleapis') ||
        url.hostname.includes('gstatic')) {
        return;
    }
    
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                // Return cached version if available
                if (cachedResponse) {
                    console.log('📦 Serving from cache:', request.url);
                    return cachedResponse;
                }
                
                // Fetch from network and cache dynamic content
                return fetch(request)
                    .then((networkResponse) => {
                        // Don't cache if not successful
                        if (!networkResponse || networkResponse.status !== 200) {
                            return networkResponse;
                        }
                        
                        // Cache dynamic content
                        const responseClone = networkResponse.clone();
                        caches.open(DYNAMIC_CACHE_NAME)
                            .then((cache) => {
                                cache.put(request, responseClone);
                            });
                        
                        console.log('🌐 Fetched and cached:', request.url);
                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('❌ Fetch failed:', error);
                        
                        // Return offline fallback for HTML pages
                        if (request.headers.get('accept').includes('text/html')) {
                            return caches.match('/offline.html');
                        }
                        
                        // Return empty response for other resources
                        return new Response('', {
                            status: 408,
                            statusText: 'Request Timeout'
                        });
                    });
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('🔄 Background sync triggered:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Handle offline actions when back online
            handleBackgroundSync()
        );
    }
});

// Push notification handler
self.addEventListener('push', (event) => {
    console.log('📢 Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'إشعار جديد من DeepBug',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'استكشاف',
                icon: '/images/checkmark.png'
            },
            {
                action: 'close',
                title: 'إغلاق',
                icon: '/images/xmark.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('DeepBug', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Handle background sync
async function handleBackgroundSync() {
    try {
        // Get pending actions from IndexedDB or localStorage
        const pendingActions = await getPendingActions();
        
        for (const action of pendingActions) {
            try {
                await processAction(action);
                await removePendingAction(action.id);
            } catch (error) {
                console.error('Failed to process action:', error);
            }
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Get pending actions (placeholder - implement with IndexedDB)
async function getPendingActions() {
    // This would typically read from IndexedDB
    return [];
}

// Process a pending action
async function processAction(action) {
    switch (action.type) {
        case 'SEND_MESSAGE':
            return await fetch('/api/chat/send', {
                method: 'POST',
                body: JSON.stringify(action.data),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        
        case 'LIKE_ARTICLE':
            return await fetch(`/api/articles/${action.data.id}/like`, {
                method: 'POST'
            });
        
        default:
            console.warn('Unknown action type:', action.type);
    }
}

// Remove processed action
async function removePendingAction(actionId) {
    // This would typically remove from IndexedDB
    console.log('Removed pending action:', actionId);
}

// Cache size management
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        return caches.delete(cacheName);
                    })
                );
            })
        );
    }
});

// Periodic cleanup of old cache entries
setInterval(() => {
    caches.open(DYNAMIC_CACHE_NAME)
        .then((cache) => {
            cache.keys().then((requests) => {
                if (requests.length > 50) {
                    // Remove oldest entries
                    const oldestRequests = requests.slice(0, 10);
                    oldestRequests.forEach((request) => {
                        cache.delete(request);
                    });
                }
            });
        });
}, 60000); // Run every minute
