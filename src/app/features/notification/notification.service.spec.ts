import { TestBed } from "@angular/core/testing";
import { NotificationService } from "./notification.service";
import { HttpClient } from "@angular/common/http";
import { KeycloakAuthService } from "app/core/session/auth/keycloak/keycloak-auth.service";
import { AngularFireMessaging } from "@angular/fire/compat/messaging";
import { Observable, of, Subject, throwError } from "rxjs";
import { AlertService } from "app/core/alerts/alert.service";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { SessionSubject } from "app/core/session/auth/session-info";
import { DatabaseResolverService } from "app/core/database/database-resolver.service";
import { FirebaseMessagingServiceWorker } from "./firebase-messaging-service-worker";
import type firebase from "firebase/compat/app";
import type { Mock } from "vitest";

class MockKeycloakAuthService {
  addAuthHeader(headers: Record<string, string>) {
    headers["Authorization"] = "Bearer mock-token";
  }
}

class MockAngularFireMessaging {
  getToken: Observable<any> = of("mock-token");
  messages = new Subject<firebase.messaging.MessagePayload>();
}

describe("NotificationService", () => {
  let service: NotificationService;
  let mockHttpClient: any;
  let mockFireMessaging: MockAngularFireMessaging;
  let notificationPermission: NotificationPermission;
  let mockRegistration: { showNotification: Mock; update: Mock };
  let mockServiceWorker: { register: Mock };

  const pushMessage = {
    notification: { title: "Update from Aam Digital", body: "Task assigned" },
    fcmOptions: { link: "https://app.example.com" },
  } as firebase.messaging.MessagePayload;

  function login() {
    TestBed.inject(SessionSubject).next({
      name: "user",
      id: "user",
      roles: [],
    });
  }

  beforeEach(() => {
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

    mockFireMessaging = new MockAngularFireMessaging();
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: KeycloakAuthService, useClass: MockKeycloakAuthService },
        { provide: AngularFireMessaging, useValue: mockFireMessaging },
        { provide: HttpClient, useValue: mockHttpClient },
        {
          provide: FirebaseMessagingServiceWorker,
          useValue: mockServiceWorker,
        },
        // only constructed, not used by the functionality under test
        { provide: AlertService, useValue: {} },
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

  afterEach(() => vi.unstubAllGlobals());

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

  it("does not listen for push messages without the notification permission", () => {
    notificationPermission = "default";

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
