import { TestBed } from "@angular/core/testing";
import { RemoteSession } from "./remote-session";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { of, throwError } from "rxjs";
import { AppConfig } from "../../app-config/app-config";
import { SessionType } from "../session-type";
import { LoggingService } from "../../logging/logging.service";
import { testSessionServiceImplementation } from "./session.service.spec";
import { DatabaseUser } from "./local-user";
import { LoginState } from "../session-states/login-state.enum";
import { TEST_PASSWORD, TEST_USER } from "../../../utils/mocked-testing.module";

describe("RemoteSessionService", () => {
  let service: RemoteSession;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;
  let dbUser: DatabaseUser;

  beforeEach(() => {
    AppConfig.SESSION_TYPE = SessionType.mock;
    mockHttpClient = jasmine.createSpyObj(["post", "delete"]);
    mockHttpClient.delete.and.returnValue(of());

    TestBed.configureTestingModule({
      providers: [
        RemoteSession,
        LoggingService,
        { provide: HttpClient, useValue: mockHttpClient },
      ],
    });

    // Remote session allows TEST_USER and TEST_PASSWORD as valid credentials
    dbUser = { name: TEST_USER, roles: ["user_app"] };
    service = TestBed.inject(RemoteSession);

    mockHttpClient.post.and.callFake((url, body) => {
      if (body.name === TEST_USER && body.password === TEST_PASSWORD) {
        return of(dbUser as any);
      } else {
        return throwError(
          new HttpErrorResponse({ status: service.UNAUTHORIZED_STATUS_CODE })
        );
      }
    });
  });

  it("should be connected after successful login", async () => {
    expect(service.loginState.value).toBe(LoginState.LOGGED_OUT);

    await service.login(TEST_USER, TEST_PASSWORD);

    expect(mockHttpClient.post).toHaveBeenCalled();
    expect(service.loginState.value).toBe(LoginState.LOGGED_IN);
  });

  it("should be unavailable if requests fails with error other than 401", async () => {
    mockHttpClient.post.and.returnValue(
      throwError(new HttpErrorResponse({ status: 501 }))
    );

    await service.login(TEST_USER, TEST_PASSWORD);

    expect(service.loginState.value).toBe(LoginState.UNAVAILABLE);
  });

  it("should be rejected if login is unauthorized", async () => {
    await service.login(TEST_USER, "wrongPassword");

    expect(service.loginState.value).toBe(LoginState.LOGIN_FAILED);
  });

  it("should disconnect after logout", async () => {
    await service.login(TEST_USER, TEST_PASSWORD);

    await service.logout();

    expect(service.loginState.value).toBe(LoginState.LOGGED_OUT);
  });

  it("should assign the current user after successful login", async () => {
    await service.login(TEST_USER, TEST_PASSWORD);

    expect(service.getCurrentUser()).toEqual({
      name: dbUser.name,
      roles: dbUser.roles,
    });
  });

  it("should not throw error when remote logout is not possible", () => {
    mockHttpClient.delete.and.returnValue(throwError(new Error()));
    return expectAsync(service.logout()).not.toBeRejected();
  });

  testSessionServiceImplementation(() => Promise.resolve(service));
});
