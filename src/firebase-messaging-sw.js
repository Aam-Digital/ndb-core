// Service worker to trigger system notifications if app is not running in foreground
// see source: https://github.com/firebase/snippets-web/blob/56d70627e2dc275f01cd0e55699794bf40faca80/messaging/service-worker.js#L10-L33

importScripts("https://www.gstatic.com/firebasejs/11.2.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.2.0/firebase-messaging-compat.js");

function loadConfig() {
  return fetch("/assets/firebase-config.json")
    .then(function(response) {
      return parseResponse(response);
    })
    .catch(function(error) {
      console.error("Could not fetch firebase-config in service worker. Background Notifications not available.", error);
    });
}

function parseResponse(response) {
  return response.json()
    .then(function(firebaseConfig) {
      return firebaseConfig;
    })
    .catch(function(error) {
      console.error("Could not parse firebase-config in service worker. Background Notifications not available.", error);
    });
}

loadConfig()
  .then(function(firebaseConfig) {
    // Initialize the Firebase app in the service worker by passing in
    // your app's Firebase config object.
    // https://firebase.google.com/docs/web/setup#config-object
    firebase.initializeApp(firebaseConfig);

    // Retrieve an instance of Firebase Messaging so that it can handle background
    // messages.
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage(function(payload) {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);
      const { title, body, image } = payload.notification;
      const notificationOptions = {
        body: body,
        icon: "/favicon.ico",
        data: {
          url: window.location.protocol + "//" + window.location.hostname,
        }
      };
      const notification = self.registration.showNotification(title, notificationOptions);

      notification.onclick = (event) => {
        let url = event.target["data"]?.["url"];
        event.preventDefault();
        if (url) {
          window.open(url, "_self");
        }
      };
    });

  });
