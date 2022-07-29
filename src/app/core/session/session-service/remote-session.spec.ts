import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { JwtToken, RemoteSession } from "./remote-session";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { of, throwError } from "rxjs";
import { SessionType } from "../session-type";
import { LoggingService } from "../../logging/logging.service";
import { testSessionServiceImplementation } from "./session.service.spec";
import { DatabaseUser } from "./local-user";
import { LoginState } from "../session-states/login-state.enum";
import { TEST_PASSWORD, TEST_USER } from "../../../utils/mocked-testing.module";
import { environment } from "../../../../environments/environment";

export function remoteSessionHttpFake(url, body) {
  const params = new URLSearchParams(body);
  const isValidPassword =
    params.get("username") === TEST_USER &&
    params.get("password") === TEST_PASSWORD;
  const isValidToken = params.get("refresh_token") === "test-refresh-token";
  if (isValidPassword || isValidToken) {
    return of(jwtTokenResponse as any);
  } else {
    return throwError(
      () =>
        new HttpErrorResponse({
          status: RemoteSession.UNAUTHORIZED_STATUS_CODE,
        })
    );
  }
}

/**
 * Check {@link https://jwt.io} to decode the access_token.
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
export const jwtTokenResponse: JwtToken = {
  access_token:
    "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJzV2FQaEdOYy1GSWpTdHBYVk96Y29oMjdSbVBpYVRwZjRlWUItUHpwU1VVIn0.eyJleHAiOjE2NTgxMzk0NTUsImlhdCI6MTY1ODEzOTM5NSwianRpIjoiY2YwZTYzNTMtNTJiMy00NzgyLTg1YjAtOWNkMzQ4MTM4YmI4IiwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo4MDgwL3JlYWxtcy9teXJlYWxtIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6InRlc3QiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJteWNsaWVudCIsInNlc3Npb25fc3RhdGUiOiI2ZWE5YzRkYi0wOGZmLTQ4MjQtOTUzMS1lNTIzODg1Y2E2NTIiLCJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHBzOi8vd3d3LmtleWNsb2FrLm9yZyJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiZGVmYXVsdC1yb2xlcy1teXJlYWxtIiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7Im15Y2xpZW50Ijp7InJvbGVzIjpbInVzZXJfYXBwIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6ImVtYWlsIHByb2ZpbGUiLCJzaWQiOiI2ZWE5YzRkYi0wOGZmLTQ4MjQtOTUzMS1lNTIzODg1Y2E2NTIiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIl9jb3VjaGRiLnJvbGVzIjpbInVzZXJfYXBwIl0sInByZWZlcnJlZF91c2VybmFtZSI6InRlc3QifQ.eynm8Zoox4Ovad0K4fYkia4mIyJUJpSfxEM0ZivQAD4LzhzDXuixsEJLQ3RFHI421k2q4wOMaorQAhjVbhmuu9CVQbPjTvNWfeO5DfTdo103KzWmQirWgBHP47H7dwF_2ksyag5HWFMTMCoD9BrNNPJPGjgkabXEFz4-dXg0GaslWd5MIO21cYqkZc_8YhFFLj9oP5gaY-9f3WTQg5YWTg7wk2YKM8IFlKrO67DMLTuO361lSdltnPNIBGzzAEC_oCM3GNFB1d8OkUnA5No89DhxCqQGHeQTKiYiJKoCdnZNQr7pIY0Ml-uNtAEHKAMV9Q6_sxqNcIFjROirdv3kkA",
  refresh_token: "test-refresh-token",
  expires_in: 120,
  session_state: "test-session-state",
};

describe("RemoteSessionService", () => {
  let service: RemoteSession;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;
  let dbUser: DatabaseUser;

  beforeEach(() => {
    environment.session_type = SessionType.mock;
    mockHttpClient = jasmine.createSpyObj(["post"]);
    mockHttpClient.post.and.callFake(remoteSessionHttpFake);

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

  it("should request token and store refresh token in local storage", async () => {
    await service.login(TEST_USER, TEST_PASSWORD);

    expect(window.localStorage.getItem(RemoteSession.REFRESH_TOKEN_KEY)).toBe(
      "test-refresh-token"
    );
  });

  it("should store access token in remote session", async () => {
    await service.login(TEST_USER, TEST_PASSWORD);

    expect(service.accessToken).toBe(jwtTokenResponse.access_token);
  });

  it("should take username and roles from jwtToken", async () => {
    await service.login(TEST_USER, TEST_PASSWORD);

    expect(service.getCurrentUser()).toEqual(dbUser);
  });

  it("should update token before it expires", fakeAsync(() => {
    // token has 2 minutes expiration time
    service.login(TEST_USER, TEST_PASSWORD);
    tick();

    mockHttpClient.post.calls.reset();
    const newToken = { ...jwtTokenResponse, access_token: "new.token" };
    // mock token cannot be parsed as JwtToken
    spyOn(window, "atob").and.returnValue('{"decoded": "token"}');
    mockHttpClient.post.and.returnValue(of(newToken));
    // should refresh token one minute before it expires
    tick(60 * 1000);

    expect(mockHttpClient.post).toHaveBeenCalled();
    expect(service.accessToken).toBe("new.token");

    // clear timeouts
    service.logout();
  }));

  testSessionServiceImplementation(() => Promise.resolve(service));
});
