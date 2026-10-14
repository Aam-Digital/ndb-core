import { inject, Injectable, Provider } from "@angular/core";
import { SERVICE_WORKER } from "@angular/fire/compat/messaging";
import { environment } from "../../../environments/environment";
import { FirebaseConfiguration } from "./notification-config.interface";
import { NAVIGATOR_TOKEN } from "../../utils/di-tokens";

/**
 * Registers the service worker that receives push messages from Firebase Cloud Messaging
 * (`src/firebase-messaging-sw.js`).
 *
 * The Firebase config (loaded from `assets/firebase-config.json` at runtime) is passed to the service worker
 * as URL query parameters: the service worker has to initialize Firebase synchronously when it starts,
 * otherwise a push message that wakes up a stopped service worker is lost
 * before Firebase has added its "push" event listener.
 */
@Injectable({ providedIn: "root" })
export class FirebaseMessagingServiceWorker {
  /**
   * Same path and scope as the Firebase SDK default,
   * so that existing registrations (and their device tokens) remain valid.
   */
  static readonly SCRIPT_PATH = "/firebase-messaging-sw.js";
  static readonly SCOPE = "/firebase-cloud-messaging-push-scope";

  private readonly navigator = inject(NAVIGATOR_TOKEN);

  /**
   * Register the service worker (or update the existing registration) and wait until it is active,
   * which is required before subscribing to push messages.
   */
  async register(): Promise<ServiceWorkerRegistration> {
    const config: FirebaseConfiguration = environment.notificationsConfig;
    if (!config) {
      throw new Error("Firebase config not available");
    }

    const params = new URLSearchParams(Object.entries(config));
    const registration = await this.navigator.serviceWorker.register(
      `${FirebaseMessagingServiceWorker.SCRIPT_PATH}?${params}`,
      { scope: FirebaseMessagingServiceWorker.SCOPE },
    );
    await waitUntilActive(registration);
    return registration;
  }
}

function waitUntilActive(registration: ServiceWorkerRegistration) {
  const incomingWorker = registration.installing ?? registration.waiting;
  if (registration.active || !incomingWorker) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    incomingWorker.addEventListener("statechange", () => {
      if (incomingWorker.state === "activated") {
        resolve();
      } else if (incomingWorker.state === "redundant") {
        reject(new Error("Push service worker could not be installed"));
      }
    });
  });
}

/**
 * Let AngularFire use our registration of the service worker instead of the Firebase default
 * (which would not pass the Firebase config to it).
 *
 * The registration is only done once AngularFire awaits it (i.e. when requesting a device token)
 * and repeated on every request, so a failed attempt (e.g. while offline) can succeed later.
 */
export function provideFirebaseMessagingServiceWorker(): Provider {
  return {
    provide: SERVICE_WORKER,
    useFactory: () => {
      const serviceWorker = inject(FirebaseMessagingServiceWorker);
      const lazyRegistration: PromiseLike<ServiceWorkerRegistration> = {
        then: (onFulfilled, onRejected) =>
          serviceWorker.register().then(onFulfilled, onRejected),
      };
      return lazyRegistration;
    },
  };
}
