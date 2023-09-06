import { TestBed } from "@angular/core/testing";

import {
  KeycloakAuthService,
  OIDCTokenResponse,
} from "./keycloak-auth.service";
import { of, throwError } from "rxjs";
import {
  HttpClient,
  HttpErrorResponse,
  HttpStatusCode,
} from "@angular/common/http";
import { AuthUser } from "../auth-user";
import { TEST_PASSWORD, TEST_USER } from "../../../../utils/mock-local-session";

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
  });

  afterEach(() =>
    window.localStorage.removeItem(KeycloakAuthService.REFRESH_TOKEN_KEY),
  );

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
