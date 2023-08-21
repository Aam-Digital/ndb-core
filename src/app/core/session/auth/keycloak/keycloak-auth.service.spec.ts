import { TestBed } from "@angular/core/testing";

import {
  KeycloakAuthService,
  OIDCTokenResponse,
} from "./keycloak-auth.service";
import {
  TEST_PASSWORD,
  TEST_USER,
} from "../../../../utils/mocked-testing.module";
import { of, throwError } from "rxjs";
import {
  HttpClient,
  HttpErrorResponse,
  HttpStatusCode,
} from "@angular/common/http";
import { AuthUser } from "../../session-service/auth-user";

function keycloakAuthHttpFake(_url, body) {
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
          status: HttpStatusCode.Unauthorized,
        }),
    );
  }
}

/**
 * Check {@link https://jwt.io} to decode the access_token.
 * Extract:
 * ```json
 * {
 *   "sub": "881ba191-0d27-4dff-9bc4-2c9e561ac900",
 *   "username": "test",
 *   "exp": 1658138259,
 *   "_couchdb.roles": [
 *      "user_app"
 *   ],
 *   ...
 * }
 * ```
 */
const jwtTokenResponse: OIDCTokenResponse = {
  access_token:
    "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJOTzU3NEpPTmoxWUM0V3VLbEtMN0R0dUdHemJTdEQ3WUFaX3FONUk0WDB3In0.eyJleHAiOjE2NTkxMTI1NjUsImlhdCI6MTY1OTExMjI2NSwianRpIjoiODYwMmJiMDQtZDA2Mi00MjcxLWFlYmMtN2I0MjY3YmY0MDNlIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay10ZXN0LmFhbS1kaWdpdGFsLmNvbTo0NDMvYXV0aC9yZWFsbXMva2V5Y2xvYWstdGVzdCIsImF1ZCI6ImFjY291bnQiLCJzdWIiOiI4ODFiYTE5MS0wZDI3LTRkZmYtOWJjNC0yYzllNTYxYWM5MDAiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJhcHAiLCJzZXNzaW9uX3N0YXRlIjoiNTYwMmNhZDgtMjgxNS00YTY5LWFlN2YtZWY2MjVmZjE1ZGUyIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIqIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJkZWZhdWx0LXJvbGVzLWtleWNsb2FrLXRlc3QiLCJvZmZsaW5lX2FjY2VzcyIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiYXBwIjp7InJvbGVzIjpbInVzZXJfYXBwIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6InByb2ZpbGUgZW1haWwiLCJzaWQiOiI1NjAyY2FkOC0yODE1LTRhNjktYWU3Zi1lZjYyNWZmMTVkZTIiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIl9jb3VjaGRiLnJvbGVzIjpbInVzZXJfYXBwIl0sInByZWZlcnJlZF91c2VybmFtZSI6InRlc3QiLCJnaXZlbl9uYW1lIjoiIiwiZmFtaWx5X25hbWUiOiIiLCJ1c2VybmFtZSI6InRlc3QifQ.g0Lq8tPN9fdni-tro7xcT4g4Ju-pyFTlYY8hjy-H34jxjkFDh6eTSjmnkof8w6r5TDg7V18k3WMz5Bf4XXt9kJtrVM0nOFq7wY-BSRdvl1TtMpRRkGlEUg5CMxCoyhkpkL1dcYslKlxNw4qwavvcjqYdtL7LU7ezZfs9wcAUV0VB9frxIzhq3WW6eHPBWYdFJFY1H5kl7jI6gtrLEc25tC-8Hpsz12Ey8O1DnsTqS7cXa1gNSGY10xYO9zNhxNfYy_x4uaaVJviT-gq9Bz-LM55H9s7Nz_FT9ETHNBm479jetBwURWLR-QRTwEdgajQWUUBw3l4Ld15q1YUSVSn1Ww",
  refresh_token: "test-refresh-token",
  session_state: "test-session-state",
};

describe("KeycloakAuthService", () => {
  let service: KeycloakAuthService;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;
  let dbUser: AuthUser;

  beforeEach(() => {
    mockHttpClient = jasmine.createSpyObj(["post"]);
    mockHttpClient.post.and.callFake(keycloakAuthHttpFake);
    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: mockHttpClient },
        KeycloakAuthService,
      ],
    });
    dbUser = { name: TEST_USER, roles: ["user_app"] };
    service = TestBed.inject(KeycloakAuthService);
    // Mock initialization of keycloak
    service["keycloakReady"] = Promise.resolve() as any;
  });

  afterEach(() =>
    window.localStorage.removeItem(KeycloakAuthService.REFRESH_TOKEN_KEY),
  );

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should take username and roles from jwtToken", async () => {
    const user = await service.authenticate(TEST_USER, TEST_PASSWORD);

    expect(user).toEqual(dbUser);
  });

  it("should trim whitespace from username", async () => {
    await service.authenticate(" " + TEST_USER + "  ", TEST_PASSWORD);
    expect(mockHttpClient.post).toHaveBeenCalledWith(
      jasmine.anything(),
      jasmine.stringContaining(`username=${TEST_USER}&`),
      jasmine.anything(),
    );
  });

  it("should store access token in memory and refresh token in local storage", async () => {
    await service.authenticate(TEST_USER, TEST_PASSWORD);

    expect(service.accessToken).toBe(jwtTokenResponse.access_token);
    expect(
      window.localStorage.getItem(KeycloakAuthService.REFRESH_TOKEN_KEY),
    ).toBe("test-refresh-token");
  });

  it("should throw a unauthorized exception if invalid_grant is returned", (done) => {
    mockHttpClient.post.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: {
              error: "invalid_grant",
              error_description: "Account disabled",
            },
          }),
      ),
    );
    service.authenticate(TEST_USER, TEST_PASSWORD).catch((err) => {
      expect(err.status).toBe(HttpStatusCode.Unauthorized);
      done();
    });
  });

  it("should call keycloak for a password reset", () => {
    const loginSpy = spyOn(service["keycloak"], "login");

    service.changePassword();

    expect(loginSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({ action: "UPDATE_PASSWORD" }),
    );
  });

  it("should login, if there is a valid refresh token", async () => {
    localStorage.setItem(
      KeycloakAuthService.REFRESH_TOKEN_KEY,
      "some-refresh-token",
    );
    mockHttpClient.post.and.returnValue(of(jwtTokenResponse));
    const user = await service.autoLogin();
    expect(user).toEqual(dbUser);
  });

  it("should not login, given that there is no valid refresh token", () => {
    mockHttpClient.post.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: {
              error: "invalid_grant",
              error_description: "Token is not active",
            },
          }),
      ),
    );
    return expectAsync(service.autoLogin()).toBeRejected();
  });

  it("should throw an error if username claim is not available", () => {
    const tokenWithoutUser =
      "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJpcjdiVjZoOVkxazBzTGh2aFRxWThlMzgzV3NMY0V3cmFsaC1TM2NJUTVjIn0.eyJleHAiOjE2OTE1Njc4NzcsImlhdCI6MTY5MTU2NzU3NywianRpIjoiNzNiNGUzODEtMzk4My00ZjI1LWE1ZGYtOTRlOTYxYmU3MjgwIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay5hYW0tZGlnaXRhbC5uZXQvcmVhbG1zL2RldiIsInN1YiI6IjI0YWM1Yzg5LTU3OGMtNDdmOC1hYmQ5LTE1ZjRhNmQ4M2JiNSIsInR5cCI6IkJlYXJlciIsImF6cCI6ImFwcCIsInNlc3Npb25fc3RhdGUiOiIwYjVhNGQ0OS0wOTFhLTQzOGYtOTEwNi1mNmZjYmQyMDM1Y2EiLCJzY29wZSI6ImVtYWlsIiwic2lkIjoiMGI1YTRkNDktMDkxYS00MzhmLTkxMDYtZjZmY2JkMjAzNWNhIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJfY291Y2hkYi5yb2xlcyI6WyJkZWZhdWx0LXJvbGVzLWRldiIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iLCJ1c2VyX2FwcCJdfQ.EvF1wc32KwdDCUGboviRYGqKv2C3yK5B1WL_hCm-IGg58DoE_XGOchVVfbFrtphXD3yQa8uAaY58jWb6SeZQt0P92qtn5ulZOqcs3q2gQfrvxkxafMWffpCsxusVLBuGJ4B4EgoRGp_puQJIJE4p5KBwcA_u0PznFDFyLzPD18AYXevGWKLP5L8Zfgitf3Lby5AtCoOKHM7u6F_hDGSvLw-YlHEZBupqJzbpsjOs2UF1_woChMm2vbllZgIaUu9bbobcWi1mZSfNP3r9Ojk2t0NauOiKXDqtG5XyBLYMTC6wZXxsoCPGhOAwDr9LffkLDl-zvZ-0f_ujTpU8M2jzsg";
    mockHttpClient.post.and.returnValue(
      of({ ...jwtTokenResponse, access_token: tokenWithoutUser }),
    );
    return expectAsync(
      service.authenticate(TEST_USER, TEST_PASSWORD),
    ).toBeRejected();
  });
});
