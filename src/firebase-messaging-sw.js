importScripts(
  "https://www.gstatic.com/firebasejs/9.1.3/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.1.3/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyAS-AmoAzv_-bRbvm1MMqKaq8t0xjZ7Wqo",
  authDomain: "aam-digital-b8a7b.firebaseapp.com",
  projectId: "aam-digital-b8a7b",
  storageBucket: "aam-digital-b8a7b.firebasestorage.app",
  messagingSenderId: "189059495005",
  appId: "1:189059495005:web:c6bdb0c8c665864b37c9b4",
  vapidKey:
    "BKkE6EgJBIwRa9-DUSKZpmkMuG7Fak2lZgxda_DPx5kYkeK8cgQM_xqurHqxRNa1b2MuW7-_t9iFbgfuXUsWF5I",
});

const messaging = firebase.messaging();

/** Handle background messages received from Firebase Cloud Messaging
 */
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