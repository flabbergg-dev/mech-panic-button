/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      new Promise(resolve => {
        if ("document" in self) {
          const script = document.createElement("script");
          script.src = uri;
          script.onload = resolve;
          document.head.appendChild(script);
        } else {
          nextDefineUri = uri;
          importScripts(uri);
          resolve();
        }
      })
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn't register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript?.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}

// Push notification handler
self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      
      event.waitUntil(
        self.registration.showNotification(data.title, {
          body: data.body,
          icon: data.icon || '/icon-192x192.png', // Fallback icon
          badge: data.badge || '/icon-192x192.png', // Fallback badge
          data: data.data || {},
          vibrate: [200, 100, 200],
          requireInteraction: true, // Keep notification visible until user interacts
          actions: data.actions || [] // Support for notification actions
        })
      );
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
});

// Notification click handler
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // Focus on existing window if available, otherwise open new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Check if there is already a window/tab open with the target URL
        const url = event.notification.data?.url || '/';
        for (const client of windowClients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Register workbox routes
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Pre-cache your important resources here
      self.skipWaiting(),
    ])
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches here
      clients.claim(),
    ])
  );
});

// Load workbox
define(['./workbox-8817a5e5'], (function (workbox) { 'use strict';
  self.skipWaiting();
  workbox.clientsClaim();

  // Start URL caching strategy
  workbox.registerRoute(
    "/",
    new workbox.NetworkFirst({
      cacheName: "start-url",
      plugins: [{
        cacheWillUpdate: async ({response}) => {
          if (response && response.type === 'opaqueredirect') {
            return new Response(response.body, {
              status: 200,
              statusText: 'OK',
              headers: response.headers
            });
          }
          return response;
        }
      }]
    }),
    'GET'
  );

  // Development mode - no caching
  if (process.env.NODE_ENV === 'development') {
    workbox.registerRoute(
      /.*/i,
      new workbox.NetworkOnly({
        cacheName: "dev",
      }),
      'GET'
    );
  } else {
    // Production caching strategies
    workbox.registerRoute(
      /\.(js|css)$/i,
      new workbox.StaleWhileRevalidate({
        cacheName: 'static-resources',
      })
    );

    workbox.registerRoute(
      /\.(png|jpg|jpeg|svg|gif|ico)$/i,
      new workbox.CacheFirst({
        cacheName: 'images',
        plugins: [
          new workbox.ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          }),
        ],
      })
    );
  }
}));
