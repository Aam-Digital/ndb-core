import { environment } from "./environments/environment";
import { Logging } from "./app/core/logging/logging.service";

importScripts("https://www.gstatic.com/firebasejs/9.1.3/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.1.3/firebase-messaging-compat.js");

firebase.initializeApp(environment.firebase);
const messaging = firebase.messaging();
messaging.onBackgroundMessage(function (payload) {
    console.log('Received background message ', payload);
    // Customize notification here
    const notificationTitle = 'Background Message Title';
    const notificationOptions = {
        body: 'Background Message body.',
        icon: '/firebase-logo.png'
    };
    self.registration.showNotification(notificationTitle,
        notificationOptions);
});

messaging.onMessage((payload) => {
    Logging.log('Message received. ', payload);
    // Add the further logic here
});

messaging.getToken({ vapidKey: environment.firebase.vapidKey }).then((currentToken) => {
    if (currentToken) {
        Logging.log('Token:', currentToken);
    } else {
        Logging.log('No registration token available. Request permission to generate one.');
    }
}
).catch((err) => {
    Logging.log('An error occurred while retrieving token. ', err);
});


