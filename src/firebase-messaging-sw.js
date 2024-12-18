importScripts(
  "https://www.gstatic.com/firebasejs/9.1.3/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.1.3/firebase-messaging-compat.js",
);

self.addEventListener("install", (event) => {
  event.waitUntil(
    new Promise((resolve, reject) => {
      // Wait for `firebaseConfig` to load
      let retries = 10;
      const interval = setInterval(() => {
        if (retries-- <= 0) {
          clearInterval(interval);
          reject(new Error("firebaseConfig not available."));
        }

        if (self.firebaseConfig) {
          clearInterval(interval);
          resolve(self.firebaseConfig);
        }
      }, 500);
    }).then((firebaseConfig) => {
      firebase.initializeApp(firebaseConfig);

      const messaging = firebase.messaging();

      messaging.onBackgroundMessage(function (payload) {
        const { title, body, icon } = payload.data;
        const notificationOptions = {
          title: title,
          body: body,
          icon: icon,
          data: {
            url: payload.data.url,
          },
        };
        self.registration.showNotification(title, notificationOptions);
      });
    }),
  );
});
