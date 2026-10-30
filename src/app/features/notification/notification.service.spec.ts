import { TestBed } from "@angular/core/testing";
import { NotificationService } from "./notification.service";
import { HttpClient } from "@angular/common/http";
import { KeycloakAuthService } from "app/core/session/auth/keycloak/keycloak-auth.service";
import { Observable, of, Subject, throwError } from "rxjs";
import { AlertService } from "app/core/alerts/alert.service";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { SessionSubject } from "app/core/session/auth/session-info";
import { DatabaseResolverService } from "app/core/database/database-resolver.service";
import { FirebaseMessagingServiceWorker } from "./firebase-messaging-service-worker";
import { FirebaseMessagingService } from "./firebase-messaging.service";
import type { MessagePayload } from "firebase/messaging";
import type { Mock } from "vitest";
import { environment } from "../../../environments/environment";
import { FirebaseConfiguration } from "./notification-config.interface";
import { Logging } from "app/core/logging/logging.service";

class MockKeycloakAuthService {
  addAuthHeader(headers: Record<string, string>) {
    headers["Authorization"] = "Bearer mock-token";
  }
}

class MockFirebaseMessagingService {
  getToken: Observable<any> = of("mock-token");
  messages = new Subject<MessagePayload>();
  deleteToken = vi.fn(() => of(true));
  isAvailable = () => true;
}

describe("NotificationService", () => {
  let service: NotificationService;
  let mockHttpClient: any;
  let mockFireMessaging: MockFirebaseMessagingService;
  let notificationPermission: NotificationPermission;
  let mockRegistration: { showNotification: Mock; update: Mock };
  let mockServiceWorker: { register: Mock };

  const pushMessage = {
    notification: { title: "Update from Aam Digital", body: "Task assigned" },
    fcmOptions: { link: "https://app.example.com" },
  } as MessagePayload;

  function login() {
    TestBed.inject(SessionSubject).next({
      name: "user",
      id: "user",
      roles: [],
    });
  }

  let originalFirebaseConfig: FirebaseConfiguration;

  beforeEach(() => {
    originalFirebaseConfig = environment.notificationsConfig;
    environment.notificationsConfig = {
      projectId: "test-project",
    } as FirebaseConfiguration;
    notificationPermission = "granted";
    vi.stubGlobal("Notification", {
      get permission() {
        return notificationPermission;
      },
    });
    mockRegistration = {
      showNotification: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
    };
    mockServiceWorker = {
      register: vi.fn().mockResolvedValue(mockRegistration),
    };

    mockFireMessaging = new MockFirebaseMessagingService();
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: KeycloakAuthService, useClass: MockKeycloakAuthService },
        { provide: FirebaseMessagingService, useValue: mockFireMessaging },
        { provide: HttpClient, useValue: mockHttpClient },
        {
          provide: FirebaseMessagingServiceWorker,
          useValue: mockServiceWorker,
        },
        { provide: AlertService, useValue: { addInfo: vi.fn() } },
        // only constructed, not used by the functionality under test
        { provide: EntityMapperService, useValue: {} },
        {
          provide: DatabaseResolverService,
          useValue: { getDatabase: vi.fn() },
        },
        SessionSubject,
      ],
    });
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    environment.notificationsConfig = originalFirebaseConfig;
  });

  it("shows push messages received after login, without waiting for the backend to confirm the device", async () => {
    login();
    mockFireMessaging.messages.next(pushMessage);

    await vi.waitFor(() =>
      expect(mockRegistration.showNotification).toHaveBeenCalledWith(
        "Update from Aam Digital",
        expect.objectContaining({
          body: "Task assigned",
          // recognized by Firebase's click handler in the service worker
          data: { FCM_MSG: expect.objectContaining(pushMessage) },
        }),
      ),
    );
    expect(mockHttpClient.get).not.toHaveBeenCalledWith(
      expect.stringContaining("/device/"),
      expect.anything(),
    );
  });

  it("does not show data-only push messages", async () => {
    login();
    mockFireMessaging.messages.next({ data: { type: "sync" } } as any);
    mockFireMessaging.messages.next(pushMessage);

    await vi.waitFor(() =>
      expect(mockRegistration.showNotification).toHaveBeenCalled(),
    );
    expect(mockRegistration.showNotification).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["the notification permission", () => (notificationPermission = "default")],
    [
      "push notifications set up for the deployment",
      () => (environment.notificationsConfig = undefined),
    ],
  ])("does not listen for push messages without %s", (_, removeSetup) => {
    removeSetup();

    login();

    expect(mockFireMessaging.messages.observed).toBe(false);
    expect(mockServiceWorker.register).not.toHaveBeenCalled();
  });

  it("shows each push message only once, even if listening is started repeatedly", async () => {
    login();
    service.listenForMessages(); // e.g. after (re-)registering the device

    mockFireMessaging.messages.next(pushMessage);

    await vi.waitFor(() =>
      expect(mockRegistration.showNotification).toHaveBeenCalled(),
    );
    expect(mockRegistration.showNotification).toHaveBeenCalledTimes(1);
  });

  it("treats a device without token as already unregistered (e.g. after the browser permission was revoked)", async () => {
    mockFireMessaging.getToken = of(null);
    const errorSpy = vi.spyOn(Logging, "error");

    service.unregisterDevice();

    await vi.waitFor(() =>
      expect(TestBed.inject(AlertService).addInfo).toHaveBeenCalledWith(
        expect.stringContaining("un-registered"),
      ),
    );
    expect(errorSpy).not.toHaveBeenCalled();
    expect(mockFireMessaging.deleteToken).not.toHaveBeenCalled();
    expect(mockHttpClient.delete).not.toHaveBeenCalled();
  });

  it("reflects a notification permission granted after the service was created", () => {
    notificationPermission = "default";
    expect(service.hasNotificationPermissionGranted()).toBe(false);

    notificationPermission = "granted";
    expect(service.hasNotificationPermissionGranted()).toBe(true);
  });

  it("isDeviceRegistered should return false when firebase is not configured", async () => {
    mockFireMessaging.getToken = of(throwError(() => "API error"));
    const result = await service.isDeviceRegistered();
    expect(result).toBe(false);
  });

  it("isDeviceRegistered should return false when device is not registered (firebase)", async () => {
    mockFireMessaging.getToken = of({});
    let result = await service.isDeviceRegistered();
    expect(result).toBe(false);

    mockFireMessaging.getToken = of(null);
    result = await service.isDeviceRegistered();
    expect(result).toBe(false);
  });

  it("isDeviceRegistered should return true when device is registered (backend)", async () => {
    // given
    mockFireMessaging.getToken = of({});
    mockHttpClient.get.mockReturnValue(
      of({
        deviceName: "device-id",
        deviceToken: "device-token",
      }),
    );

    // when
    const result = await service.isDeviceRegistered();

    // then
    expect(result).toBe(true);
  });

  it("isDeviceRegistered should return false when device is not registered (backend)", async () => {
    // given
    mockFireMessaging.getToken = of({});
    mockHttpClient.get.mockReturnValue(of(null));

    // when
    const result = await service.isDeviceRegistered();

    // then
    expect(result).toBe(false);
  });

  it("isDeviceRegistered should return false when backend throws error", async () => {
    // given
    mockFireMessaging.getToken = of({});
    mockHttpClient.get.mockImplementation(() => {
      throw new Error("API error");
    });

    // when
    const result = await service.isDeviceRegistered();

    // then
    expect(result).toBe(false);
  });
});
