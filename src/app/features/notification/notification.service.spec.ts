import { TestBed } from "@angular/core/testing";
import { NotificationService } from "./notification.service";
import { HttpClient } from "@angular/common/http";
import { KeycloakAuthService } from "app/core/session/auth/keycloak/keycloak-auth.service";
import { AngularFireMessaging } from "@angular/fire/compat/messaging";
import { Observable, of, throwError } from "rxjs";
import { AlertService } from "app/core/alerts/alert.service";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { SessionSubject } from "app/core/session/auth/session-info";
import { DatabaseResolverService } from "app/core/database/database-resolver.service";

class MockKeycloakAuthService {
  addAuthHeader(headers: Record<string, string>) {
    headers["Authorization"] = "Bearer mock-token";
  }
}

class MockAngularFireMessaging {
  getToken: Observable<any> = of("mock-token");
}

describe("NotificationService", () => {
  let service: NotificationService;
  let mockHttpClient: any;
  let mockFireMessaging: MockAngularFireMessaging;

  beforeEach(() => {
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
        // only constructed, not used by the device registration checks under test
        { provide: AlertService, useValue: {} },
        { provide: EntityMapperService, useValue: {} },
        { provide: DatabaseResolverService, useValue: {} },
        SessionSubject,
      ],
    });
    service = TestBed.inject(NotificationService);
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
