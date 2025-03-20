import { TestBed } from "@angular/core/testing";
import { NotificationService } from "./notification.service";
import { HttpClient } from "@angular/common/http";
import { KeycloakAuthService } from "app/core/session/auth/keycloak/keycloak-auth.service";
import { MockedTestingModule } from "app/utils/mocked-testing.module";
import { AngularFireMessaging } from "@angular/fire/compat/messaging";
import { Observable, of, throwError } from "rxjs";

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
  let mockHttpClient: jasmine.SpyObj<HttpClient>;
  let mockFireMessaging: MockAngularFireMessaging;

  beforeEach(() => {
    mockFireMessaging = new MockAngularFireMessaging();
    mockHttpClient = jasmine.createSpyObj(["get", "post", "delete"]);
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
    expect(result).toBeFalse();
  });

  it("isDeviceRegistered should return false when device is not registered (firebase)", async () => {
    mockFireMessaging.getToken = of({});
    let result = await service.isDeviceRegistered();
    expect(result).toBeFalse();

    mockFireMessaging.getToken = of(null);
    result = await service.isDeviceRegistered();
    expect(result).toBeFalse();
  });

  it("isDeviceRegistered should return true when device is registered (backend)", async () => {
    // given
    mockFireMessaging.getToken = of({});
    mockHttpClient.get.and.returnValue(
      of({
        deviceName: "device-id",
        deviceToken: "device-token",
      }),
    );

    // when
    const result = await service.isDeviceRegistered();

    // then
    expect(result).toBeTrue();
  });

  it("isDeviceRegistered should return false when device is not registered (backend)", async () => {
    // given
    mockFireMessaging.getToken = of({});
    mockHttpClient.get.and.returnValue(of(null));

    // when
    const result = await service.isDeviceRegistered();

    // then
    expect(result).toBeFalse();
  });

  it("isDeviceRegistered should return false when backend throws error", async () => {
    // given
    mockFireMessaging.getToken = of({});
    mockHttpClient.get.and.throwError("API error");

    // when
    const result = await service.isDeviceRegistered();

    // then
    expect(result).toBeFalse();
  });
});
