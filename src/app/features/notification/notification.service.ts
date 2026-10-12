import { computed, inject, Injectable, resource, signal } from "@angular/core";
import { Logging } from "app/core/logging/logging.service";
import { HttpClient } from "@angular/common/http";
import { KeycloakAuthService } from "app/core/session/auth/keycloak/keycloak-auth.service";
import { AngularFireMessaging } from "@angular/fire/compat/messaging";
import { filter, firstValueFrom, mergeMap, Subscription, take } from "rxjs";
import { environment } from "../../../environments/environment";
import { AlertService } from "../../core/alerts/alert.service";
import { catchError, map } from "rxjs/operators";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { NotificationConfig } from "./model/notification-config";
import { SessionSubject } from "../../core/session/auth/session-info";
import { SyncedPouchDatabase } from "../../core/database/pouchdb/synced-pouch-database";
import { NotificationEvent } from "./model/notification-event";
import { DatabaseResolverService } from "../../core/database/database-resolver.service";
import { FirebaseMessagingServiceWorker } from "./firebase-messaging-service-worker";
import type firebase from "firebase/compat/app";

/**
 * Status of a backend feature, as reported by the `/actuator/features` endpoint.
 */
interface FeatureFlag {
  enabled: boolean;
}

/**
 * Feature flags from the `/actuator/features` endpoint.
 * Sub-features are nested under their parent feature (e.g. `notification.email`).
 */
type FeatureFlags = Record<string, FeatureFlag> & {
  notification?: FeatureFlag & { email?: FeatureFlag };
};

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
  private readonly messagingServiceWorker = inject(
    FirebaseMessagingServiceWorker,
  );

  private tokenSubscription: Subscription | undefined = undefined;
  private messagesSubscription: Subscription | undefined = undefined;

  private readonly featureFlagsResource = resource({
    loader: async () => {
      try {
        return await firstValueFrom(
          this.httpClient.get<FeatureFlags>(
            environment.API_PROXY_PREFIX + "/actuator/features",
          ),
        );
      } catch (err) {
        Logging.debug("Notification API not available", err);
        return {} as FeatureFlags;
      }
    },
  });

  readonly isNotificationServerEnabled = computed(
    () => this.featureFlagsResource.value()?.["notification"]?.enabled ?? false,
  );

  readonly isEmailNotificationEnabled = computed(
    () =>
      this.featureFlagsResource.value()?.["notification"]?.email?.enabled ??
      false,
  );

  private readonly NOTIFICATION_API_URL =
    environment.API_PROXY_PREFIX + "/v1/notification";

  constructor() {
    // init listening to push messages once the user is logged in
    this.sessionInfo
      .pipe(filter(Boolean), take(1))
      .subscribe(() => this.init());
  }

  private init() {
    if (!this.hasNotificationPermissionGranted()) {
      // push notifications cannot have been enabled on this device
      return;
    }

    // keep the service worker up to date (current Firebase config and script version),
    // as the browser checks for updates of this service worker only rarely
    this.messagingServiceWorker
      .register()
      .then((registration) => registration.update().catch(() => undefined)) // fails while offline
      .catch((err) =>
        Logging.warn("Could not register push service worker", err),
      );
    // not waiting for the backend to confirm the device registration, which would fail while offline
    this.listenForMessages();
  }

  async loadNotificationConfig(userId: string): Promise<NotificationConfig> {
    return this.entityMapper.load<NotificationConfig>(
      NotificationConfig,
      userId,
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
   * This listener creates system notifications while the app is visible
   * (otherwise the firebase-messaging-sw shows them).
   */
  listenForMessages(): void {
    if (this.messagesSubscription && !this.messagesSubscription.closed) {
      return;
    }

    Logging.debug("Starting to listen for Push Messages");
    this.messagesSubscription = this.firebaseMessaging.messages.subscribe({
      next: (payload) => {
        Logging.debug("Received Push Message", payload);

        // trigger immediate sync
        const db = this.databaseResolver.getDatabase(
          NotificationEvent.DATABASE,
        );
        if (db instanceof SyncedPouchDatabase) {
          db.sync().catch((err) =>
            Logging.warn("Failed sync notifications db upon push message", err),
          );
        }

        this.showNotification(payload).catch((err) =>
          Logging.warn("Could not show push notification", err),
        );
      },
      error: (err) => {
        Logging.error("Error while listening for messages.", err);
      },
    });
  }

  /**
   * Show a system notification through the service worker
   * (the `Notification` constructor is not supported on mobile browsers).
   *
   * The payload is attached the same way Firebase does for notifications it shows itself,
   * so that Firebase's click handler in the service worker also handles clicks on these (focus or open the app).
   */
  private async showNotification(payload: firebase.messaging.MessagePayload) {
    if (!payload.notification) {
      // data-only message, not meant to be displayed (Firebase also doesn't show these while in background)
      return;
    }

    const registration = await this.messagingServiceWorker.register();
    await registration.showNotification(payload.notification.title, {
      body: payload.notification.body,
      icon: "/assets/icons/favicon.png",
      data: {
        FCM_MSG: {
          ...payload,
          fcmOptions: {
            ...payload.fcmOptions,
            link: payload.fcmOptions?.link ?? window.location.origin,
          },
        },
      },
    });
  }

  readonly isPushNotificationSupported = signal("Notification" in window);

  /**
   * Whether the user has given this app the browser permission to show notifications.
   * (Not a signal, because the user can change the permission at any time outside the app.)
   */
  hasNotificationPermissionGranted(): boolean {
    return (
      this.isPushNotificationSupported() &&
      Notification.permission === "granted"
    );
  }
}
