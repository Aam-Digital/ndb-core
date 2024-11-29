const { environments } = require("eslint-plugin-prettier");

importScripts("https://www.gstatic.com/firebasejs/9.1.3/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.1.3/firebase-messaging-compat.js");
firebase.initializeApp({
    apiKey: "AIzaSyC8PIhZ2VZ5sDmXHWp1V0LmhTfRghBOLGI",
    authDomain: "push-notification-37d2a.firebaseapp.com",
    projectId: "push-notification-37d2a",
    storageBucket: "push-notification-37d2a.firebasestorage.app",
    messagingSenderId: "762806445328",
    appId: "1:762806445328:web:10800dabfd5ad8bf5c3195",
    measurementId: "G-9Z03T96S55"
});
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
    console.log('Message received. ', payload);
    // ...
});

messaging.getToken({ vapidKey: environments.vapidKey }).then((currentToken) => {
    if (currentToken) {
        console.log('Token:', currentToken);
    } else {
        console.log('No registration token available. Request permission to generate one.');
    }
}
).catch((err) => {
    console.log('An error occurred while retrieving token. ', err);
});


