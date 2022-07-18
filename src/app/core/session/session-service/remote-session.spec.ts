import { TestBed } from "@angular/core/testing";
import { JwtToken, RemoteSession } from "./remote-session";
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
  /**
   * Check {@link jwt.io} to decode the JWT token.
   * Extract:
   * ```json
   * {
   *   "sub": "test",
   *   "exp": 1658138259,
   *   "_couchdb.roles": [
   *      "user_app"
   *   ],
   *   ...
   * }
   * ```
   */
  const jwtTokenResponse: JwtToken = {
    access_token:
      "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJzV2FQaEdOYy1GSWpTdHBYVk96Y29oMjdSbVBpYVRwZjRlWUItUHpwU1VVIn0.eyJleHAiOjE2NTgxMzk0NTUsImlhdCI6MTY1ODEzOTM5NSwianRpIjoiY2YwZTYzNTMtNTJiMy00NzgyLTg1YjAtOWNkMzQ4MTM4YmI4IiwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo4MDgwL3JlYWxtcy9teXJlYWxtIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6InRlc3QiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJteWNsaWVudCIsInNlc3Npb25fc3RhdGUiOiI2ZWE5YzRkYi0wOGZmLTQ4MjQtOTUzMS1lNTIzODg1Y2E2NTIiLCJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHBzOi8vd3d3LmtleWNsb2FrLm9yZyJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiZGVmYXVsdC1yb2xlcy1teXJlYWxtIiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7Im15Y2xpZW50Ijp7InJvbGVzIjpbInVzZXJfYXBwIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6ImVtYWlsIHByb2ZpbGUiLCJzaWQiOiI2ZWE5YzRkYi0wOGZmLTQ4MjQtOTUzMS1lNTIzODg1Y2E2NTIiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIl9jb3VjaGRiLnJvbGVzIjpbInVzZXJfYXBwIl0sInByZWZlcnJlZF91c2VybmFtZSI6InRlc3QifQ.eynm8Zoox4Ovad0K4fYkia4mIyJUJpSfxEM0ZivQAD4LzhzDXuixsEJLQ3RFHI421k2q4wOMaorQAhjVbhmuu9CVQbPjTvNWfeO5DfTdo103KzWmQirWgBHP47H7dwF_2ksyag5HWFMTMCoD9BrNNPJPGjgkabXEFz4-dXg0GaslWd5MIO21cYqkZc_8YhFFLj9oP5gaY-9f3WTQg5YWTg7wk2YKM8IFlKrO67DMLTuO361lSdltnPNIBGzzAEC_oCM3GNFB1d8OkUnA5No89DhxCqQGHeQTKiYiJKoCdnZNQr7pIY0Ml-uNtAEHKAMV9Q6_sxqNcIFjROirdv3kkA",
    refresh_token: "test-refresh-token",
  };

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
    service = TestBed.inject(RemoteSession);

    mockHttpClient.post.and.callFake((url, body) => {
      if (body.name === TEST_USER && body.password === TEST_PASSWORD) {
        return of(dbUser as any);
      } else {
        return throwError(
          () =>
            new HttpErrorResponse({ status: service.UNAUTHORIZED_STATUS_CODE })
        );
      }
    });
  });

  afterEach(() =>
    window.localStorage.removeItem(RemoteSession.REFRESH_TOKEN_KEY)
  );

  it("should be unavailable if requests fails with error other than 401", async () => {
    mockHttpClient.post.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 501 }))
    );

    await service.login(TEST_USER, TEST_PASSWORD);

    expect(service.loginState.value).toBe(LoginState.UNAVAILABLE);
  });

  it("should not throw error when remote logout is not possible", () => {
    mockHttpClient.delete.and.returnValue(throwError(() => new Error()));
    return expectAsync(service.logout()).not.toBeRejected();
  });

  it("should request token and store refresh token in local storage", async () => {
    mockHttpClient.post.and.returnValue(of(jwtTokenResponse));

    await service.login(TEST_USER, TEST_PASSWORD);

    expect(window.localStorage.getItem(RemoteSession.REFRESH_TOKEN_KEY)).toBe(
      "test-refresh-token"
    );
  });

  it("should store access token in remote session", async () => {
    mockHttpClient.post.and.returnValue(of(jwtTokenResponse));

    await service.login(TEST_USER, TEST_PASSWORD);

    expect(service.accessToken).toBe(jwtTokenResponse.access_token);
  });

  it("should take username and roles from jwtToken", async () => {
    mockHttpClient.post.and.returnValue(of(jwtTokenResponse));

    await service.login(TEST_USER, TEST_PASSWORD);

    expect(service.getCurrentUser()).toEqual(dbUser);
  });

  testSessionServiceImplementation(() => Promise.resolve(service));
});
