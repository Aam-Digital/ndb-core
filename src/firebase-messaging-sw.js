import { environment } from "../src/environments/environment";
importScripts(
  "https://www.gstatic.com/firebasejs/9.1.3/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.1.3/firebase-messaging-compat.js",
);

firebase.initializeApp(environment.firebase);

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
