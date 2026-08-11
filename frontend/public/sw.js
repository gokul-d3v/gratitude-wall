// Service Worker for Web Push Notifications

self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      
      const options = {
        body: data.body || 'You have a new notification.',
        icon: data.icon || '/vite.svg',
        badge: '/vite.svg',
        vibrate: [200, 100, 200],
        data: {
          url: data.url || '/'
        }
      };

      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
          let isVisible = false;
          for (let i = 0; i < windowClients.length; i++) {
            if (windowClients[i].visibilityState === 'visible') {
              isVisible = true;
              break;
            }
          }

          // If the app is actively visible, let the frontend (App.tsx socket) handle the notification
          // to avoid double notifications. Only show push notification if app is hidden/closed.
          if (!isVisible) {
            return self.registration.showNotification(data.title || 'Gratitude Wall', options);
          }
        })
      );
    } catch (e) {
      console.error('Error parsing push data', e);
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      if (windowClients.length > 0) {
        return windowClients[0].focus();
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
