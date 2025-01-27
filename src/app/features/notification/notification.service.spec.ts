import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { NotificationService } from "./notification.service";
import { provideHttpClient } from "@angular/common/http";
import { KeycloakAuthService } from "app/core/session/auth/keycloak/keycloak-auth.service";
import { MockedTestingModule } from "app/utils/mocked-testing.module";
import { of } from "rxjs";

class MockKeycloakAuthService {
  addAuthHeader(headers: Record<string, string>) {
    headers["Authorization"] = "Bearer mock-token";
  }
}

describe("NotificationService", () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
      providers: [
        provideHttpClientTesting(),
        provideHttpClient(),
        { provide: KeycloakAuthService, useClass: MockKeycloakAuthService },
      ],
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should return false if browser push permission is not granted", async () => {
    spyOnProperty(Notification, "permission", "get").and.returnValue("denied");
    const result = await service.checkDeviceRegistered();
    expect(result).toBeFalse();
  });

  it("should return false if aam-backend does not have device registered", async () => {
    spyOnProperty(Notification, "permission", "get").and.returnValue("granted");
    spyOn(service["firebaseMessaging"] as any, "getToken").and.returnValue(
      of("mock-token"),
    );
    spyOn(service, "registerNotificationToken").and.returnValue(
      Promise.reject(new Error("error")),
    );
    const result = await service.checkDeviceRegistered();
    expect(result).toBeFalse();
  });

  it("should return false if firebase does not have device registered", async () => {
    spyOnProperty(Notification, "permission", "get").and.returnValue("granted");
    spyOn(service["firebaseMessaging"] as any, "getToken").and.returnValue(
      of(null),
    );
    const result = await service.checkDeviceRegistered();
    expect(result).toBeFalse();
  });

  it("should return true if all conditions are met", async () => {
    spyOnProperty(Notification, "permission", "get").and.returnValue("granted");
    spyOn(service["firebaseMessaging"] as any, "getToken").and.returnValue(
      of("mock-token"),
    );
    spyOn(service, "registerNotificationToken").and.returnValue(
      Promise.resolve({}),
    );
    const result = await service.checkDeviceRegistered();
    expect(result).toBeTrue();
  });
});
