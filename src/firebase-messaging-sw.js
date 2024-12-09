import { environment } from "../src/environments/environment";
importScripts("https://www.gstatic.com/firebasejs/9.1.3/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.1.3/firebase-messaging-compat.js");

firebase.initializeApp(environment.firebase);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('Received background message ', payload);
    const { title, body, icon } = payload.data;
    const notificationOptions = {
        body: body,
        icon: icon,
    };
    self.registration.showNotification(title, notificationOptions);
});


