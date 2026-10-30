import { TestBed } from "@angular/core/testing";
import { firstValueFrom } from "rxjs";
import type { Mock } from "vitest";
import type { MessagePayload, Messaging } from "firebase/messaging";
import {
  FIREBASE_SDK,
  FirebaseMessagingService,
} from "./firebase-messaging.service";
import { FirebaseMessagingServiceWorker } from "./firebase-messaging-service-worker";
import { environment } from "../../../environments/environment";
import { FirebaseConfiguration } from "./notification-config.interface";

describe("FirebaseMessagingService", () => {
  let service: FirebaseMessagingService;
  let registerServiceWorker: Mock;
  let notificationPermission: NotificationPermission;
  let originalConfig: FirebaseConfiguration;
  let loadSdk: Mock;
  let sdk: Record<
    | "initializeApp"
    | "isSupported"
    | "getMessaging"
    | "getToken"
    | "deleteToken"
    | "onMessage",
    Mock
  >;

  const config = {
    apiKey: "test-api-key",
    projectId: "test-project",
  } as FirebaseConfiguration;
  const messaging = {} as Messaging;
  const registration = {} as ServiceWorkerRegistration;
  const stopListening = vi.fn();

  beforeEach(() => {
    originalConfig = environment.notificationsConfig;
    environment.notificationsConfig = config;
    notificationPermission = "granted";
    vi.stubGlobal("Notification", {
      get permission() {
        return notificationPermission;
      },
      requestPermission: vi.fn(async () => notificationPermission),
    });
    vi.stubGlobal("PushManager", class {});
    registerServiceWorker = vi.fn().mockResolvedValue(registration);
    sdk = {
      initializeApp: vi.fn().mockReturnValue({}),
      isSupported: vi.fn().mockResolvedValue(true),
      getMessaging: vi.fn().mockReturnValue(messaging),
      getToken: vi.fn().mockResolvedValue("device-token"),
      deleteToken: vi.fn().mockResolvedValue(true),
      onMessage: vi.fn().mockReturnValue(stopListening),
    };
    loadSdk = vi.fn().mockResolvedValue(sdk);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: FirebaseMessagingServiceWorker,
          useValue: { register: registerServiceWorker },
        },
        { provide: FIREBASE_SDK, useValue: loadSdk },
      ],
    });
    service = TestBed.inject(FirebaseMessagingService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    environment.notificationsConfig = originalConfig;
  });

  it("requests the device token through our service worker registration, which passes the Firebase config", async () => {
    await expect(firstValueFrom(service.requestToken)).resolves.toBe(
      "device-token",
    );

    expect(Notification.requestPermission).toHaveBeenCalled();
    expect(sdk.initializeApp).toHaveBeenCalledWith(config);
    expect(sdk.getToken).toHaveBeenCalledWith(messaging, {
      serviceWorkerRegistration: registration,
    });
  });

  it.each([
    [
      "without the notification permission",
      () => (notificationPermission = "denied"),
      false,
    ],
    [
      "without push notifications set up for the deployment",
      () => (environment.notificationsConfig = undefined),
      false,
    ],
    [
      "in browsers without the Notification API",
      () => vi.stubGlobal("Notification", undefined),
      false,
    ],
    [
      "in browsers without the Push API",
      () => vi.stubGlobal("PushManager", undefined),
      false,
    ],
    [
      "in browsers Firebase does not support",
      () => sdk.isSupported.mockResolvedValue(false),
      true,
    ],
  ])("has no device token %s", async (_, removeSetup, downloadsSdk) => {
    removeSetup();

    await expect(firstValueFrom(service.getToken)).resolves.toBeNull();
    await expect(firstValueFrom(service.requestToken)).resolves.toBeNull();
    expect(registerServiceWorker).not.toHaveBeenCalled();
    expect(sdk.getToken).not.toHaveBeenCalled();
    expect(loadSdk).toHaveBeenCalledTimes(downloadsSdk ? 1 : 0);
  });

  it("loads Firebase again after a failed attempt (e.g. offline)", async () => {
    loadSdk.mockRejectedValueOnce(new Error("chunk could not be loaded"));

    await expect(firstValueFrom(service.deleteToken())).rejects.toThrow();
    await expect(firstValueFrom(service.getToken)).resolves.toBe(
      "device-token",
    );
    await expect(firstValueFrom(service.deleteToken())).resolves.toBe(true);
    expect(sdk.initializeApp).toHaveBeenCalledTimes(1);
  });

  it("passes on push messages until unsubscribed", async () => {
    const received: MessagePayload[] = [];
    const subscription = service.messages.subscribe((m) => received.push(m));
    await vi.waitFor(() => expect(sdk.onMessage).toHaveBeenCalled());

    const firebaseHandler = sdk.onMessage.mock.calls[0][1];
    firebaseHandler({ data: { type: "sync" } });
    expect(received).toEqual([{ data: { type: "sync" } }]);

    subscription.unsubscribe();
    expect(stopListening).toHaveBeenCalled();
  });
});
