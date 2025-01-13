import { TestBed } from "@angular/core/testing";
import {
  provideHttpClientTesting,
  HttpTestingController,
} from "@angular/common/http/testing";
import { NotificationService } from "./notification.service";
import { environment } from "../../../environments/environment";
import firebase from "firebase/compat/app";
import { provideHttpClient } from "@angular/common/http";
import { NotificationConfig } from "./notification-config.interface";
import { KeycloakAuthService } from "app/core/session/auth/keycloak/keycloak-auth.service";
import { MockedTestingModule } from "app/utils/mocked-testing.module";

class MockKeycloakAuthService {
  addAuthHeader(headers: Record<string, string>) {
    headers["Authorization"] = "Bearer mock-token";
  }
}

describe("NotificationService", () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;
  let mockNotificationConfig: NotificationConfig;

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
    mockNotificationConfig = {
      apiKey: "AIzaSyDummyApiKey1234567890",
      authDomain: "dummy-project.firebaseapp.com",
      projectId: "dummy-project",
      storageBucket: "test_bucket",
      messagingSenderId: "test_sender",
      appId: "test_app",
      vapidKey:
        "BDC__Xj3AlfMKQKJ7k3zvMSnGupQp7c9Lw38JnzYTdFVqW3obznt8F0MPy-X1T5Vw8LUwRBBEHn2y9D8mRwF0uL",
      enabled: true,
    };
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("init", () => {
    it("should initialize Firebase with valid config", () => {
      environment.notificationsConfig = mockNotificationConfig;
      spyOn(firebase, "initializeApp").and.callThrough();
      service.init();
      expect(firebase.initializeApp).toHaveBeenCalledWith(
        environment.notificationsConfig,
      );
    });
  });

  describe("getNotificationToken", () => {
    it("should return notification token from cookies if available", async () => {
      spyOn(service, "getNotificationTokenFromCookie").and.returnValue(
        "existingToken",
      );

      const token = await service.getNotificationToken();

      expect(token).toBeNull();
    });

    it("should retrieve notification token from Firebase if not in cookies", async () => {
      spyOn(service, "getNotificationTokenFromCookie").and.returnValue(null);
      spyOn(service, "getNotificationTokenFromFirebase").and.returnValue(
        Promise.resolve("newToken"),
      );
      spyOn(service, "setCookie").and.stub();
      spyOn(service, "registerNotificationToken").and.stub();

      const token = await service.getNotificationToken();

      expect(token).toBe("newToken");
      expect(service.getNotificationTokenFromFirebase).toHaveBeenCalled();
      expect(service.setCookie).toHaveBeenCalledWith(
        service["NOTIFICATION_TOKEN_COOKIE_NAME"],
        "newToken",
        service["COOKIE_EXPIRATION_DAYS_FOR_NOTIFICATION_TOKEN"],
      );
      expect(service.registerNotificationToken).toHaveBeenCalledWith(
        "newToken",
      );
    });

    it("should return null if there is an error during token retrieval", async () => {
      spyOn(service, "getNotificationTokenFromFirebase").and.throwError(
        "Error retrieving token",
      );
      spyOn(service, "getNotificationTokenFromCookie").and.returnValue(null);

      const token = await service.getNotificationToken();

      expect(token).toBeNull();
    });
  });

  describe("sendNotification", () => {
    it("should send notification if token exists in cookies", async () => {
      spyOn(service, "getNotificationTokenFromCookie").and.returnValue(
        "existingToken",
      );
      spyOn(service, "sendNotificationThroughAPI").and.stub();

      const result = await service.sendNotification();

      expect(result).toBeTrue();
      expect(service.getNotificationTokenFromCookie).toHaveBeenCalled();
      expect(service.sendNotificationThroughAPI).toHaveBeenCalled();
    });

    it("should return false if no token exists in cookies", async () => {
      spyOn(service, "getNotificationTokenFromCookie").and.returnValue(null);
      spyOn(service, "sendNotificationThroughAPI").and.stub();

      const result = await service.sendNotification();

      expect(result).toBeFalse();
      expect(service.getNotificationTokenFromCookie).toHaveBeenCalled();
      expect(service.sendNotificationThroughAPI).not.toHaveBeenCalled();
    });
  });
});
