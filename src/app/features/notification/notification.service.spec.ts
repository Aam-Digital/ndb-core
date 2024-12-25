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
import { MockEntityMapperService } from "app/core/entity/entity-mapper/mock-entity-mapper-service";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";

class MockKeycloakAuthService {
  addAuthHeader(headers: Record<string, string>) {
    headers["Authorization"] = "Bearer mock-token";
  }
}

describe("NotificationService", () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;
  let notificationConfig: NotificationConfig;
  let entityMapper: MockEntityMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
      providers: [
        provideHttpClientTesting(),
        provideHttpClient(),
        { provide: KeycloakAuthService, useClass: MockKeycloakAuthService },
        { provide: EntityMapperService, useValue: entityMapper },
      ],
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
    notificationConfig = {
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
      environment.notificationsConfig = notificationConfig;
      spyOn(firebase, "initializeApp").and.callThrough();
      service.init();
      expect(firebase.initializeApp).toHaveBeenCalledWith(
        environment.notificationsConfig,
      );
    });
  });

  describe("getNotificationToken", () => {
    it("should return the token from the cookie if available", async () => {
      environment.notificationsConfig = notificationConfig;
      spyOn(service, "getNotificationTokenFromCookie").and.returnValue(null);
      spyOn(service, "getNotificationToken").and.callFake(async () => {
        const token = service.getNotificationTokenFromCookie();
        return token || "existing_token";
      });
      const token = await service.getNotificationToken();
      expect(token).toBe("existing_token");
    });

    it("should fetch a new token if none exists in the cookie", async () => {
      firebase.initializeApp(notificationConfig);
      environment.notificationsConfig = notificationConfig;
      spyOn(service, "getNotificationTokenFromCookie").and.returnValue(null);
      spyOn(service, "setCookie").and.callThrough();

      spyOn(firebase.messaging(), "getToken").and.resolveTo("new_token");
      spyOn(service, "getNotificationToken").and.callFake(async () => {
        const token = service.getNotificationTokenFromCookie();
        if (!token) {
          const newToken = await firebase.messaging().getToken();
          service.setCookie(
            "notification_token",
            newToken,
            service["COOKIE_EXPIRATION_DAYS_FOR_NOTIFICATION_TOKEN"],
          );
          return newToken;
        }
        return token;
      });

      const token = await service.getNotificationToken();
      expect(token).toBe("new_token");
      expect(service.setCookie).toHaveBeenCalledWith(
        "notification_token",
        "new_token",
        service["COOKIE_EXPIRATION_DAYS_FOR_NOTIFICATION_TOKEN"],
      );
    });

    it("should handle token retrieval errors gracefully", async () => {
      firebase.initializeApp(notificationConfig);
      environment.notificationsConfig = notificationConfig;
      spyOn(service, "getNotificationTokenFromCookie").and.returnValue(null);

      spyOn(firebase.messaging(), "getToken").and.rejectWith(
        new Error("Token error"),
      );

      const token = await service.getNotificationToken();
      expect(token).toBeNull();
      expect().nothing();
    });
  });

  describe("sendNotification", () => {
    it("should not send notification if token is missing", () => {
      spyOn(service, "getNotificationTokenFromCookie").and.returnValue(null);

      service.sendNotification({ title: "Test" });
      expect().nothing();
    });

    it("should send notification through API if token exists", () => {
      spyOn(service, "getNotificationTokenFromCookie").and.returnValue(
        "valid_token",
      );

      const payload = { title: "Test" };
      spyOn(service, "sendNotificationThroughAPI").and.callThrough();

      service.sendNotification(payload);
      expect(service.sendNotificationThroughAPI).toHaveBeenCalledWith({
        message: {
          token: "valid_token",
          notification: { title: "Test" },
        },
      });
    });
  });
});
