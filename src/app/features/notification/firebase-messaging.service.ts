import { inject, Injectable, InjectionToken } from "@angular/core";
import { defer, Observable } from "rxjs";
import type * as AppSdk from "firebase/app";
import type * as MessagingSdk from "firebase/messaging";
import { environment } from "../../../environments/environment";
import { FirebaseMessagingServiceWorker } from "./firebase-messaging-service-worker";

type FirebaseSdk = Pick<typeof AppSdk, "initializeApp"> &
  Pick<
    typeof MessagingSdk,
    "isSupported" | "getMessaging" | "getToken" | "deleteToken" | "onMessage"
  >;

/**
 * Loads the parts of the Firebase SDK used here (as a separate chunk).
 */
export const FIREBASE_SDK = new InjectionToken<() => Promise<FirebaseSdk>>(
  "FIREBASE_SDK",
  {
    providedIn: "root",
    factory: () => async () => {
      const [app, messaging] = await Promise.all([
        import("firebase/app"),
        import("firebase/messaging"),
      ]);
      return { ...messaging, initializeApp: app.initializeApp };
    },
  },
);

interface LoadedFirebase {
  sdk: FirebaseSdk;
  messaging: MessagingSdk.Messaging;
}

/**
 * Quick check of the browser APIs, so the SDK (which checks support in detail) is not downloaded without them.
 */
function hasPushApis(): boolean {
  return (
    typeof Notification !== "undefined" && typeof PushManager !== "undefined"
  );
}

/**
 * Access to Firebase Cloud Messaging in the app window.
 *
 * The Firebase SDK is only loaded (as a separate chunk) once a token or messages are requested.
 * Without a Firebase config for this deployment, or in browsers without push support,
 * there is no token and no messages.
 */
@Injectable({ providedIn: "root" })
export class FirebaseMessagingService {
  private readonly serviceWorker = inject(FirebaseMessagingServiceWorker);
  private readonly loadSdk = inject(FIREBASE_SDK);
  private firebase: Promise<LoadedFirebase | undefined> | undefined;

  /**
   * The token of this device, or `null` if the user has not granted the notification permission.
   */
  readonly getToken: Observable<string | null> = defer(() => this.loadToken());

  /**
   * Ask the user for the notification permission (if not decided yet), then get the token of this device.
   */
  readonly requestToken: Observable<string | null> = defer(async () => {
    if (hasPushApis()) {
      await Notification.requestPermission();
    }
    return this.loadToken();
  });

  /**
   * Push messages received while the app is in the foreground
   * (otherwise the service worker receives them).
   */
  readonly messages = new Observable<MessagingSdk.MessagePayload>(
    (subscriber) => {
      let unsubscribe: (() => void) | undefined;
      this.loadFirebase()
        .then((firebase) => {
          if (firebase && !subscriber.closed) {
            unsubscribe = firebase.sdk.onMessage(
              firebase.messaging,
              (payload) => subscriber.next(payload),
            );
          }
        })
        .catch((err) => subscriber.error(err));
      return () => unsubscribe?.();
    },
  );

  /**
   * Delete the token of this device, which stops push messages to it.
   */
  deleteToken(): Observable<boolean> {
    return defer(async () => {
      const firebase = await this.loadFirebase();
      return firebase ? firebase.sdk.deleteToken(firebase.messaging) : false;
    });
  }

  private async loadToken(): Promise<string | null> {
    if (!hasPushApis() || Notification.permission !== "granted") {
      return null;
    }
    const firebase = await this.loadFirebase();
    if (!firebase) {
      return null;
    }

    // our registration passes the Firebase config to the service worker, Firebase's default one does not
    const serviceWorkerRegistration = await this.serviceWorker.register();
    return firebase.sdk.getToken(firebase.messaging, {
      serviceWorkerRegistration,
    });
  }

  private loadFirebase(): Promise<LoadedFirebase | undefined> {
    this.firebase ??= this.initFirebase().catch((err) => {
      // e.g. the chunk could not be loaded while offline: try again next time
      this.firebase = undefined;
      throw err;
    });
    return this.firebase;
  }

  private async initFirebase(): Promise<LoadedFirebase | undefined> {
    const config = environment.notificationsConfig;
    if (!config || !hasPushApis()) {
      return undefined;
    }

    const sdk = await this.loadSdk();
    if (!(await sdk.isSupported())) {
      return undefined;
    }
    return { sdk, messaging: sdk.getMessaging(sdk.initializeApp(config)) };
  }
}
