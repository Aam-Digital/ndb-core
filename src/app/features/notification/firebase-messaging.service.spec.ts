import { TestBed } from "@angular/core/testing";
import { firstValueFrom } from "rxjs";
import type { Mock } from "vitest";
import { FirebaseMessagingService } from "./firebase-messaging.service";
import { FirebaseMessagingServiceWorker } from "./firebase-messaging-service-worker";
import { environment } from "../../../environments/environment";
import { FirebaseConfiguration } from "./notification-config.interface";

describe("FirebaseMessagingService", () => {
  let service: FirebaseMessagingService;
  let registerServiceWorker: Mock;
  let notificationPermission: NotificationPermission;
  let originalConfig: FirebaseConfiguration;

  beforeEach(() => {
    originalConfig = environment.notificationsConfig;
    environment.notificationsConfig = {
      apiKey: "test-api-key",
      projectId: "test-project",
    } as FirebaseConfiguration;
    notificationPermission = "granted";
    vi.stubGlobal("Notification", {
      get permission() {
        return notificationPermission;
      },
    });
    registerServiceWorker = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: FirebaseMessagingServiceWorker,
          useValue: { register: registerServiceWorker },
        },
      ],
    });
    service = TestBed.inject(FirebaseMessagingService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    environment.notificationsConfig = originalConfig;
  });

  it.each([
    [
      "without the notification permission",
      () => (notificationPermission = "denied"),
    ],
    [
      "without push notifications set up for the deployment",
      () => (environment.notificationsConfig = undefined),
    ],
    // jsdom has no PushManager
    ["in browsers without push support", () => undefined],
  ])("has no device token %s", async (_, removeSetup) => {
    removeSetup();

    await expect(firstValueFrom(service.getToken)).resolves.toBeNull();
    expect(registerServiceWorker).not.toHaveBeenCalled();
  });
});
