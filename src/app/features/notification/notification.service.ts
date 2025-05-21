import { inject, Injectable } from "@angular/core";
import { Logging } from "app/core/logging/logging.service";
import { HttpClient } from "@angular/common/http";
import { KeycloakAuthService } from "app/core/session/auth/keycloak/keycloak-auth.service";
import { AngularFireMessaging } from "@angular/fire/compat/messaging";
import { firstValueFrom, mergeMap, of, Subscription } from "rxjs";
import { environment } from "../../../environments/environment";
import { AlertService } from "../../core/alerts/alert.service";
import { catchError, map } from "rxjs/operators";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { NotificationConfig } from "./model/notification-config";
import { SessionSubject } from "../../core/session/auth/session-info";
import { SyncedPouchDatabase } from "../../core/database/pouchdb/synced-pouch-database";
import { NotificationEvent } from "./model/notification-event";
import { DatabaseResolverService } from "../../core/database/database-resolver.service";

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
  private readonly firebaseMessaging = inject(AngularFireMessaging);
  private readonly httpClient = inject(HttpClient);
  private readonly authService = inject(KeycloakAuthService);
  private readonly alertService = inject(AlertService);
  private readonly entityMapper = inject(EntityMapperService);
  private readonly sessionInfo = inject(SessionSubject);
  private readonly databaseResolver = inject(DatabaseResolverService);

  private tokenSubscription: Subscription | undefined = undefined;

  private readonly NOTIFICATION_API_URL =
    environment.API_PROXY_PREFIX + "/v1/notification";

  constructor() {
    // init listening to push messages once the session (with userId) is ready
    this.sessionInfo.subscribe((sessionInfo) => this.init());
  }

  async init() {
    if (await this.isDeviceRegistered()) {
      this.listenForMessages();
    }
  }

  async loadNotificationConfig(userId: string): Promise<NotificationConfig> {
    return this.entityMapper.load<NotificationConfig>(
      NotificationConfig,
      userId,
    );
  }

  /**
   * Check if API module is actually available / enabled.
   */
  async isNotificationServerEnabled(): Promise<boolean> {
    return firstValueFrom(
      this.httpClient
        .get(environment.API_PROXY_PREFIX + "/actuator/features")
        .pipe(
          map((res) => {
            return res?.["notification"]?.enabled ?? false;
          }),
          catchError((err) => {
            // if aam-services backend is not running --> 502
            // if aam-services Notification API disabled --> 404
            Logging.debug("Notification API not available", err);
            return of(false);
          }),
        ),
    );
  }

  /**
   * Request a token device from firebase and register it in aam-backend
   */
  registerDevice(): void {
    this.tokenSubscription?.unsubscribe();
    this.tokenSubscription = undefined;

    this.tokenSubscription = this.firebaseMessaging.requestToken.subscribe({
      next: (token) => {
        if (!token) {
          Logging.error("Could not get token for device.");
          this.alertService.addInfo(
            $localize`Please enable notification permissions to receive important updates.`,
          );
          return;
        }
        this.registerNotificationToken(token)
          .then(() => {
            Logging.log("Device registered in aam-digital backend.");
            this.alertService.addInfo(
              $localize`Device registered for push notifications.`,
            );
            this.listenForMessages();
          })
          .catch((err) => {
            Logging.error(
              "Could not register device in aam-digital backend. Push notifications will not work.",
              err,
            );
            this.alertService.addInfo(
              $localize`Could not register device in aam-digital backend. Push notifications will not work. Please try to disable and enable again.`,
            );
          });
      },
      error: (err) => {
        this.tokenSubscription?.unsubscribe();
        this.tokenSubscription = undefined;
        if (err.code === 20) {
          this.registerDevice();
        } else {
          this.alertService.addInfo(
            $localize`User has rejected the authorisation request.`,
          );
          Logging.error("User has rejected the authorisation request.", err);
        }
      },
    });
  }

  isDeviceRegistered(): Promise<boolean> {
    return firstValueFrom(
      this.firebaseMessaging.getToken
        .pipe(
          mergeMap((token) => {
            if (!token) {
              return Promise.resolve(false);
            }
            const headers = {};
            this.authService.addAuthHeader(headers);

            return this.httpClient
              .get(this.NOTIFICATION_API_URL + "/device/" + token, {
                headers,
              })
              .pipe(
                map((value) => {
                  return value !== null;
                }),
              );
          }),
        )
        .pipe(
          catchError((err, caught) => {
            return Promise.resolve(false);
          }),
        ),
    );
  }

  /**
   * Unregister a device from firebase, this will disable push notifications.
   */
  unregisterDevice(): void {
    let tempToken = null;
    this.firebaseMessaging.getToken
      .pipe(
        mergeMap((token) => {
          tempToken = token;
          return this.firebaseMessaging.deleteToken(token);
        }),
      )
      .subscribe({
        next: (success: boolean) => {
          if (!success) {
            this.alertService.addInfo(
              $localize`Could not unregister device from firebase.`,
            );
            Logging.error("Could not unregister device from firebase.");
            return;
          }

          this.unRegisterNotificationToken(tempToken).catch((err) => {
            Logging.error("Could not unregister device from aam-backend.", err);
          });

          this.alertService.addInfo(
            $localize`Device un-registered for push notifications.`,
          );
        },
        error: (err) => {
          Logging.error("Could not unregister device from firebase.", err);
        },
      });
  }

  /**
   * Registers the device with the backend using the FCM token.
   * @param notificationToken - The FCM token for the device.
   * @param deviceName - The name of the device.
   */
  registerNotificationToken(
    notificationToken: string,
    deviceName: string = "web", // todo something useful here
  ): Promise<Object> {
    const payload = { deviceToken: notificationToken, deviceName };
    const headers = {};
    this.authService.addAuthHeader(headers);

    return firstValueFrom(
      this.httpClient.post(this.NOTIFICATION_API_URL + "/device", payload, {
        headers,
      }),
    );
  }

  /**
   * Unregister the device with the backend using the FCM token.
   * @param notificationToken - The FCM token for the device.
   */
  unRegisterNotificationToken(notificationToken: string): Promise<Object> {
    const headers = {};
    this.authService.addAuthHeader(headers);

    return firstValueFrom(
      this.httpClient.delete(
        this.NOTIFICATION_API_URL + "/device/" + notificationToken,
        {
          headers,
        },
      ),
    );
  }

  testNotification(): Promise<Object> {
    const headers = {};
    this.authService.addAuthHeader(headers);

    return firstValueFrom(
      this.httpClient
        .post(this.NOTIFICATION_API_URL + "/message/device-test", null, {
          headers,
        })
        .pipe(
          catchError((err) => {
            this.alertService.addWarning(
              $localize`Error trying to send test notification. If this error persists, please try to disable and enable "push notifications" again.`,
            );
            throw err;
          }),
        ),
    );
  }

  /**
   * Listens for incoming Firebase Cloud Messages (FCM) in real time.
   * Displays a browser notification when a message is received.
   *
   * This listener creates system notifications while the app is running
   * (If app is not running, the firebase-messaging-sw is listening)
   */
  listenForMessages(): void {
    Logging.debug("Starting to listen for Push Messages");
    this.firebaseMessaging.messages.subscribe({
      next: (payload) => {
        Logging.debug("Received Push Message", payload);

        // trigger immediate sync
        const db = this.databaseResolver.getDatabase(
          NotificationEvent.DATABASE,
        );
        (db as SyncedPouchDatabase)
          .sync()
          .catch((err) =>
            Logging.warn("Failed sync notifications db upon push message", err),
          );

        let notification = new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: "/favicon.ico",
          data: {
            url: window.location.protocol + "//" + window.location.hostname,
            // "/foo-bar/123", // todo: deep link here
          },
        });

        notification.onclick = (event) => {
          let url = event.target["data"]?.["url"];
          event.preventDefault();
          if (url) {
            window.open(url, "_self");
          }
        };
      },
      error: (err) => {
        Logging.error("Error while listening for messages.", err);
      },
    });
  }

  /**
   * user given the notification permission to browser or not
   * @returns boolean
   */
  hasNotificationPermissionGranted(): boolean {
    if (!this.isPushNotificationSupported()) {
      return false;
    }

    switch (Notification.permission) {
      case "granted":
        return true;
      case "denied":
        return false;
      default:
        return false;
    }
  }

  /**
   * Check if Notification API is supported in this browser
   */
  isPushNotificationSupported() {
    return "Notification" in window;
  }
}
