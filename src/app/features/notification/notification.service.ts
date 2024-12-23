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
  /**
   * A private instance of the Firebase Cloud Messaging service.
   * This property is used to delegate messaging operations to the Firebase Cloud Messaging service.
   */
  private messaging: firebase.messaging.Messaging = null;
  readonly FIREBASE_CLOUD_MESSAGING_URL = `https://fcm.googleapis.com/v1/projects/${environment.notificationsConfig.projectId}/messages:send`;
  private readonly NOTIFICATION_TOKEN_COOKIE_NAME = "notification_token";
  private readonly DEVICE_NOTIFICATION_API_URL =
    "/query/api/v1/notification/device";
  private readonly COOKIE_EXPIRATION_DAYS_FOR_NOTIFICATION_TOKEN = 30;

  constructor(private httpClient: HttpClient) {}

  init() {
    firebase.initializeApp(environment.notificationsConfig);
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
  async getFcmToken(): Promise<string | null> {
    try {
      const existingNotificationToken = this.getNotificationTokenFromCookie();

      const notificationToken = await getToken(this.messaging, {
        vapidKey: environment.notificationsConfig.vapidKey,
      });

      if (notificationToken === existingNotificationToken) {
        return existingNotificationToken;
      }

      try {
        this.registerNotificationToken(notificationToken);
      } catch {
        this.setCookie(this.NOTIFICATION_TOKEN_COOKIE_NAME, "", null);
        return null;
      }

      this.setCookie(
        this.NOTIFICATION_TOKEN_COOKIE_NAME,
        notificationToken,
        this.COOKIE_EXPIRATION_DAYS_FOR_NOTIFICATION_TOKEN,
      );

      return notificationToken;
    } catch (err) {
      Logging.error("An error occurred while retrieving token: ", err);
      return null;
    }
  }

  /**
   * Registers the device with the backend using the FCM token.
   * @param notificationToken - The FCM token for the device.
   * @param deviceName - The name of the device.
   */

  private registerNotificationToken(
    notificationToken: string,
    deviceName: string = "web",
  ) {
    const payload = { deviceToken: notificationToken, deviceName };

    try {
      this.httpClient
        .post(this.DEVICE_NOTIFICATION_API_URL, payload)
        .subscribe();
    } catch (err) {
      throw new Error("Device registration failed");
    }
  }

  /**
   * Retrieves the value of token from a cookie if it exists.
   */
  getNotificationTokenFromCookie(): string | null {
    const cookies = new URLSearchParams(document.cookie.replace(/; /g, "&"));
    return cookies.get(this.NOTIFICATION_TOKEN_COOKIE_NAME) || null;
  }

  /**
   * Sets a cookie with a specified name, value, and expiration days.
   * @param name - The name of the cookie.
   * @param value - The value of the cookie.
   * @param days - The number of days until the cookie expires.
   */
  setCookie(name: string, value: string, days: number): void {
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
      this.sendNotificationThroughAPI(fcmPayload);
    } else {
      Logging.error("FCM Token is undefined. Notification not sent. ");
    }
  }

  /**
   * Sends a notification using the FCM HTTP API.
   * @param fcmPayload - The payload generated by createFcmPayload.
   */
  sendNotificationThroughAPI(fcmPayload: Object) {
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
