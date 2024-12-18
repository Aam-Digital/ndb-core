import { Injectable } from "@angular/core";
import "firebase/compat/messaging";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { Logging } from "app/core/logging/logging.service";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import firebase from "firebase/compat/app";

/**
 * Handles the interaction with Firebase Cloud Messaging (FCM).
 * It manages the retrieval of FCM tokens, listens for incoming messages, and sends notifications
 * to users. The service also provides methods to create FCM payloads and communicate with the
 * Firebase Cloud Messaging HTTP API for sending notifications.
 */
@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private messaging: any = null;
  readonly FIREBASE_CLOUD_MESSAGING_URL = `https://fcm.googleapis.com/v1/projects/${environment.firebaseConfig.projectId}/messages:send`;

  constructor(private httpClient: HttpClient) {
    firebase.initializeApp(environment.firebaseConfig);
    this.messaging = firebase.messaging();
  }

  /**
   * Generates a consistent FCM payload.
   * @param payload - Custom data payload.
   */
  private createFcmPayload(token: string, payload: Record<string, any> = {}) {
    return {
      message: {
        token,
        notification: {
          ...payload,
        },
      },
    };
  }

  /**
   * Requests permission for Firebase messaging and retrieves the token.
   * Logs the token if successful, otherwise logs an error or info message.
   */
  async getFcmToken(): Promise<any> {
    try {
      const notificationToken = await getToken(this.messaging, {
        vapidKey: environment.firebaseConfig.vapidKey,
      });
      if (notificationToken) {
        // TODO: Need to Implement the logic to save the FCM token in the Cookie and update in the backend API.
        return notificationToken;
      } else {
        Logging.log(
          "No registration token available. Request permission to generate one.",
        );
      }
    } catch (err) {
      Logging.error("An error occurred while retrieving token: ", err);
    }
  }

  /**
   * Listens for incoming Firebase Cloud Messages (FCM) in real time.
   * Displays a browser notification when a message is received.
   */
  listenForMessages() {
    const messaging = getMessaging();
    onMessage(messaging, (payload) => {
      const { notification } = payload;
      if (notification) {
        new Notification(notification.title, {
          body: notification.body,
          icon: notification.icon,
        });
      }
    });
  }

  /**
   * Sends a notification to the user.
   * First retrieves the FCM token and then calls the notification sending function.
   */
  async sendNotification(payload: Record<string, any> = {}) {
    const notificationToken = await this.getFcmToken();
    if (notificationToken) {
      const fcmPayload = this.createFcmPayload(notificationToken, payload);
      this.sendNotificationToUser(fcmPayload);
    } else {
      Logging.error("FCM Token is undefined. Notification not sent.");
    }
  }

  /**
   * Sends a notification using the FCM HTTP API.
   * @param payload - The payload generated by createFcmPayload.
   */
  sendNotificationToUser(fcmPayload: Object) {
    // TODO: Implement the FIREBASE_ACCESS_TOKEN from backend service
    const headers = {
      Authorization: `Bearer <FIREBASE_ACCESS_TOKEN>`,
      "Content-Type": "application/json",
    };

    this.httpClient.post(this.FIREBASE_CLOUD_MESSAGING_URL, fcmPayload, {
      headers,
    });
  }
}
