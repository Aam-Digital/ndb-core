import { Injectable } from '@angular/core';
import { environment } from "../src/environments/environment";
import firebase from 'firebase/compat/app';
import 'firebase/compat/messaging';
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { Logging } from 'app/core/logging/logging.service';

@Injectable({
  providedIn: 'root',
})
export class FirebaseNotificationService {
  private messaging: any = null;

  constructor() {
    firebase.initializeApp(environment.firebase);
    this.messaging = firebase.messaging();
  }

  /**
   * Request permission for Firebase messaging and retrieve the token.
   */
  requestPermission() {
    Logging.log("Requesting permission for Firebase messaging...");
    getToken(this.messaging, { vapidKey: environment.firebase.vapidKey })
      .then((currentToken) => {
        if (currentToken) {
          Logging.log(currentToken);
          Logging.log("FCM Token Generated");
        } else {
          Logging.log("No registration token available. Request permission to generate one.");
        }
      })
      .catch((err) => {
        Logging.error("An error occurred while retrieving token: ", err);
      });
  }

  listenForMessages() {
    const messaging = getMessaging();
    onMessage(messaging, (payload) => {
      Logging.log(payload);
      this.messaging = payload;
    });
  }
}
