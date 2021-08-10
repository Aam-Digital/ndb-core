import { TestBed } from "@angular/core/testing";
import { RemoteSession } from "./remote-session";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { ConnectionState } from "../session-states/connection-state.enum";
import { of, throwError } from "rxjs";
import { AppConfig } from "../../app-config/app-config";
import { SessionType } from "../session-type";
import { LoggingService } from "../../logging/logging.service";
import {
  TEST_PASSWORD,
  TEST_USER,
  testSessionServiceImplementation,
} from "./session.service.spec";
import { DatabaseUser } from "./local-user";
import { LoginState } from "../session-states/login-state.enum";

describe("RemoteSessionService", () => {
  let service: RemoteSession;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;
  let dbUser: DatabaseUser;

  beforeEach(() => {
    AppConfig.settings = {
      site_name: "test",
      session_type: SessionType.mock,
      database: {
        name: "database",
        remote_url: "database_url",
      },
    };
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
    mockHttpClient.post.and.callFake((url, body) => {
      if (body.name === TEST_USER && body.password === TEST_PASSWORD) {
        return of(dbUser as any);
      } else {
        return throwError(
          new HttpErrorResponse({ statusText: "Unauthorized" })
        );
      }
    });

    service = TestBed.inject(RemoteSession);
  });

  it("should be connected after successful login", async () => {
    expect(service.getConnectionState().getState()).toBe(
      ConnectionState.DISCONNECTED
    );
    expect(service.getLoginState().getState()).toBe(LoginState.LOGGED_OUT);

    await service.login(TEST_USER, TEST_PASSWORD);

    expect(mockHttpClient.post).toHaveBeenCalled();
    expect(service.getLoginState().getState()).toBe(LoginState.LOGGED_IN);
  });

  it("should be unavailable if offline", async () => {
    mockHttpClient.post.and.returnValue(
      throwError(new HttpErrorResponse({ status: 501 }))
    );

    await service.login(TEST_USER, TEST_PASSWORD);

    expect(service.getLoginState().getState()).toBe(LoginState.UNAVAILABLE);
  });

  it("should be rejected if login is unauthorized", async () => {
    await service.login(TEST_USER, "wrongPassword");

    expect(service.getLoginState().getState()).toBe(LoginState.LOGIN_FAILED);
  });

  it("should disconnect after logout", async () => {
    await service.login(TEST_USER, TEST_PASSWORD);

    await service.logout();

    expect(service.getLoginState().getState()).toBe(LoginState.LOGGED_OUT);
  });

  it("should assign the current user after successful login", async () => {
    await service.login(TEST_USER, TEST_PASSWORD);

    expect(service.getCurrentDBUser()).toEqual({
      name: dbUser.name,
      roles: dbUser.roles,
    });
  });

  testSessionServiceImplementation(() => Promise.resolve(service));
});
