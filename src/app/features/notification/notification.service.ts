import { inject, Injectable } from "@angular/core";
import { Logging } from "app/core/logging/logging.service";
import { HttpClient } from "@angular/common/http";
import { KeycloakAuthService } from "app/core/session/auth/keycloak/keycloak-auth.service";
import { AngularFireMessaging } from "@angular/fire/compat/messaging";
import { firstValueFrom, mergeMap, Subscription } from "rxjs";
import { environment } from "../../../environments/environment";
import { AlertService } from "../../core/alerts/alert.service";
import { catchError } from "rxjs/operators";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { NotificationConfig } from "./model/notification-config";
import { SessionSubject } from "../../core/session/auth/session-info";

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
  private firebaseMessaging = inject(AngularFireMessaging);
  private httpClient = inject(HttpClient);
  private authService = inject(KeycloakAuthService);
  private alertService = inject(AlertService);
  private readonly entityMapper = inject(EntityMapperService);
  private readonly sessionInfo = inject(SessionSubject);

  private tokenSubscription: Subscription | undefined = undefined;

  private readonly NOTIFICATION_API_URL =
    environment.API_PROXY_PREFIX + "/v1/notification";

  async init() {
    const notificationConfig = await this.loadNotificationConfig().catch(
      () => null,
    );

    if (notificationConfig?.channels?.push) {
      this.listenForMessages();
    }
  }

  async loadNotificationConfig() {
    return this.entityMapper.load<NotificationConfig>(
      NotificationConfig,
      this.sessionInfo.value?.id,
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
              $localize`Could not register device in aam-digital backend. Push notifications will not work.`,
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
   */
  listenForMessages(): void {
    this.firebaseMessaging.messages.subscribe({
      next: (payload) => {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: payload.notification.image,
        });
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
    switch (Notification.permission) {
      case "granted":
        return true;
      case "denied":
        return false;
      default:
        return false;
    }
  }
}
