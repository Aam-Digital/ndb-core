// Service worker receiving push messages from Firebase Cloud Messaging.
// If no app window is visible, Firebase shows the notification itself (and opens the app when it is clicked).
// Otherwise, Firebase passes the message on to the app window instead (see NotificationService.listenForMessages).
// see https://firebase.google.com/docs/cloud-messaging/js/receive

importScripts(
  "https://www.gstatic.com/firebasejs/11.2.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/11.2.0/firebase-messaging-compat.js",
);

// The app passes the Firebase config as URL parameters when registering this service worker
// (see FirebaseMessagingServiceWorker).
// Firebase has to be initialized synchronously here: event listeners must be added during the initial run of this script,
// otherwise a push message that wakes up the stopped service worker is lost.
const firebaseConfig = Object.fromEntries(
  new URL(self.location.href).searchParams,
);

if (firebaseConfig.apiKey) {
  firebase.initializeApp(firebaseConfig);
  firebase.messaging();
} else {
  // Registered by an older app version without the config in the URL (re-registered when the app is opened next).
  // Initializing Firebase asynchronously misses push messages that wake up the stopped service worker.
  fetch("/assets/firebase-config.json")
    .then(function (response) {
      return response.json();
    })
    .then(function (config) {
      firebase.initializeApp(config);
      firebase.messaging();
    })
    .catch(function (error) {
      console.error(
        "Could not load firebase-config in service worker. Background Notifications not available.",
        error,
      );
    });
}

// Clicks on notifications that the app itself shows while it is in the foreground (see NotificationService).
// Notifications shown by Firebase carry their own data and are handled by Firebase's click listener.
self.addEventListener("notificationclick", function (event) {
  const appUrl = event.notification.data?.appUrl;
  if (!appUrl) {
    return;
  }

  event.notification.close();
  event.waitUntil(focusOrOpenApp(appUrl));
});

function focusOrOpenApp(appUrl) {
  return self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then(function (windows) {
      const appWindow = windows.find(function (client) {
        return new URL(client.url).origin === self.location.origin;
      });
      return appWindow ? appWindow.focus() : self.clients.openWindow(appUrl);
    });
}
