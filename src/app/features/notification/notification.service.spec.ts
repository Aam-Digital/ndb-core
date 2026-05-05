import { TestBed } from "@angular/core/testing";
import { NotificationService } from "./notification.service";
import { HttpClient } from "@angular/common/http";
import { KeycloakAuthService } from "app/core/session/auth/keycloak/keycloak-auth.service";
import { MockedTestingModule } from "app/utils/mocked-testing.module";
import { AngularFireMessaging } from "@angular/fire/compat/messaging";
import { Observable, of, throwError } from "rxjs";

class MockKeycloakAuthService {
  addAuthHeader(headers: Record<string, string>) {
    headers["Authorization"] = "Bearer test-token";
  }
  async addFreshAuthHeader(headers: Record<string, string>) {
    this.addAuthHeader(headers);
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
      imports: [MockedTestingModule.withState()],
      providers: [
        { provide: KeycloakAuthService, useClass: MockKeycloakAuthService },
        { provide: AngularFireMessaging, useValue: mockFireMessaging },
        { provide: HttpClient, useValue: mockHttpClient },
      ],
    });
    service = TestBed.inject(NotificationService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
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
