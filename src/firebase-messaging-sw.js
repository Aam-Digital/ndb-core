importScripts(
  "https://www.gstatic.com/firebasejs/9.1.3/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.1.3/firebase-messaging-compat.js",
);

async function initializeFirebase() {
  const response = await fetch("/assets/firebase-config.json");
  if (!response.ok) {
    throw new Error("Failed to load Firebase config");
  }
  const firebaseConfig = await response.json();

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
}

initializeFirebase();
