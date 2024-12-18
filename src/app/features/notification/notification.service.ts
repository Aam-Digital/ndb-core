import { Injectable } from "@angular/core";
import "firebase/compat/messaging";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { Logging } from "app/core/logging/logging.service";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import firebase from "firebase/compat/app";

/**
 * Handles the interaction with Cloud Messaging.
 * It manages the retrieval of Cloud Messaging Notification token, listens for incoming messages, and sends notifications
 * to users. The service also provides methods to create cloud messaging payloads and communicate with the
 * cloud messaging HTTP API for sending notifications.
 */
@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private messaging: any = null;
  readonly FIREBASE_CLOUD_MESSAGING_URL = `https://fcm.googleapis.com/v1/projects/${environment.firebaseConfig.projectId}/messages:send`;
  private readonly NOTIFICATION_TOKEN_COOKIE_NAME = "notification_token";
  private readonly DEVICE_NOTIFICATION_API_URL = "/api/v1/notification/device";

  constructor(private httpClient: HttpClient) {
    firebase.initializeApp(environment.firebaseConfig);
    this.messaging = firebase.messaging();
  }

  /**
   * Generates a consistent FCM payload.
   * @param token - The FCM token for the device.
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
  async getFcmToken(): Promise<string> {
    try {
      const existingToken = this.getNotificationTokenFromCookie();
      if (existingToken) {
        return existingToken;
      }

      const notificationToken = await getToken(this.messaging, {
        vapidKey: environment.firebaseConfig.vapidKey,
      });

      if (notificationToken !== existingToken) {
        this.setCookie(
          this.NOTIFICATION_TOKEN_COOKIE_NAME,
          notificationToken,
          30,
        );

        this.registerTokenWithBackend(notificationToken);

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
   * Registers the device with the backend using the FCM token.
   * @param notificationToken - The FCM token for the device.
   */

  private registerTokenWithBackend(notificationToken: string) {
    const payload = { fcm_token: notificationToken };

    try {
      this.httpClient
        .post(this.DEVICE_NOTIFICATION_API_URL, payload)
        .subscribe();
      Logging.log("Device registered successfully.");
    } catch (err) {
      Logging.error("Failed to register device: ", err);
    }
  }

  /**
   * Retrieves the value of a cookie by name.
   * @param name - The name of the cookie.
   */
  getNotificationTokenFromCookie() {
    const cookies = new URLSearchParams(document.cookie.replace(/; /g, "&"));
    return cookies.get(this.NOTIFICATION_TOKEN_COOKIE_NAME) || null;
  }

  /**
   * Sets a cookie with a specified name, value, and expiration days.
   * @param name - The name of the cookie.
   * @param value - The value of the cookie.
   * @param days - The number of days until the cookie expires.
   */
  private setCookie(name: string, value: string, days: number): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
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
    const notificationToken = this.getNotificationTokenFromCookie();
    if (notificationToken) {
      const fcmPayload = this.createFcmPayload(notificationToken, payload);
      this.sendNotificationToUser(fcmPayload);
    } else {
      Logging.error("FCM Token is undefined. Notification not sent.");
    }
  }

  /**
   * Sends a notification using the FCM HTTP API.
   * @param fcmPayload - The payload generated by createFcmPayload.
   */
  sendNotificationToUser(fcmPayload: Object) {
    // TODO: Implement the FIREBASE_ACCESS_TOKEN from backend service
    const headers = {
      Authorization: `Bearer <FIREBASE_ACCESS_TOKEN>`,
      "Content-Type": "application/json",
    };

    this.httpClient
      .post(this.FIREBASE_CLOUD_MESSAGING_URL, fcmPayload, {
        headers,
      })
      .subscribe();
  }
}
