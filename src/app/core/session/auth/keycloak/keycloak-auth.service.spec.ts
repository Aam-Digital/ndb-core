import { TestBed } from "@angular/core/testing";

import { KeycloakAuthService } from "./keycloak-auth.service";
import { HttpClient } from "@angular/common/http";
import { KeycloakService } from "keycloak-angular";

/**
 * Check {@link https://jwt.io} to decode the token.
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
const keycloakToken =
  "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJOTzU3NEpPTmoxWUM0V3VLbEtMN0R0dUdHemJTdEQ3WUFaX3FONUk0WDB3In0.eyJleHAiOjE2NTkxMTI1NjUsImlhdCI6MTY1OTExMjI2NSwianRpIjoiODYwMmJiMDQtZDA2Mi00MjcxLWFlYmMtN2I0MjY3YmY0MDNlIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay10ZXN0LmFhbS1kaWdpdGFsLmNvbTo0NDMvYXV0aC9yZWFsbXMva2V5Y2xvYWstdGVzdCIsImF1ZCI6ImFjY291bnQiLCJzdWIiOiI4ODFiYTE5MS0wZDI3LTRkZmYtOWJjNC0yYzllNTYxYWM5MDAiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJhcHAiLCJzZXNzaW9uX3N0YXRlIjoiNTYwMmNhZDgtMjgxNS00YTY5LWFlN2YtZWY2MjVmZjE1ZGUyIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIqIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJkZWZhdWx0LXJvbGVzLWtleWNsb2FrLXRlc3QiLCJvZmZsaW5lX2FjY2VzcyIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiYXBwIjp7InJvbGVzIjpbInVzZXJfYXBwIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6InByb2ZpbGUgZW1haWwiLCJzaWQiOiI1NjAyY2FkOC0yODE1LTRhNjktYWU3Zi1lZjYyNWZmMTVkZTIiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIl9jb3VjaGRiLnJvbGVzIjpbInVzZXJfYXBwIl0sInByZWZlcnJlZF91c2VybmFtZSI6InRlc3QiLCJnaXZlbl9uYW1lIjoiIiwiZmFtaWx5X25hbWUiOiIiLCJ1c2VybmFtZSI6InRlc3QifQ.g0Lq8tPN9fdni-tro7xcT4g4Ju-pyFTlYY8hjy-H34jxjkFDh6eTSjmnkof8w6r5TDg7V18k3WMz5Bf4XXt9kJtrVM0nOFq7wY-BSRdvl1TtMpRRkGlEUg5CMxCoyhkpkL1dcYslKlxNw4qwavvcjqYdtL7LU7ezZfs9wcAUV0VB9frxIzhq3WW6eHPBWYdFJFY1H5kl7jI6gtrLEc25tC-8Hpsz12Ey8O1DnsTqS7cXa1gNSGY10xYO9zNhxNfYy_x4uaaVJviT-gq9Bz-LM55H9s7Nz_FT9ETHNBm479jetBwURWLR-QRTwEdgajQWUUBw3l4Ld15q1YUSVSn1Ww";

describe("KeycloakAuthService", () => {
  let service: KeycloakAuthService;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;
  let mockKeycloak: jasmine.SpyObj<KeycloakService>;

  beforeEach(() => {
    mockHttpClient = jasmine.createSpyObj(["post"]);
    mockKeycloak = jasmine.createSpyObj([
      "updateToken",
      "getToken",
      "login",
      "init",
    ]);
    mockKeycloak.updateToken.and.resolveTo();
    mockKeycloak.getToken.and.resolveTo(keycloakToken);
    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: mockHttpClient },
        { provide: KeycloakService, useValue: mockKeycloak },
        KeycloakAuthService,
      ],
    });
    service = TestBed.inject(KeycloakAuthService);
    service["keycloakReady"] = Promise.resolve(true);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should return user object after successful login check", () => {
    return expectAsync(service.login()).toBeResolvedTo({
      name: "test",
      roles: ["user_app"],
      entityId: "test",
    });
  });

  it("should use `sub` if `username` is not available", () => {
    const tokenWithoutUsername =
      "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJycVB3eFM4U1hXZ2FGOFBDbDZrYWFkVUxOYWQyaEloX21vQjhmTDdUVnJJIn0.eyJleHAiOjE3MDcyMTk0MTgsImlhdCI6MTcwNzIxNTgxOCwiYXV0aF90aW1lIjoxNzA3MjE1MDQxLCJqdGkiOiI0OWZjMjEyZS0wNGMwLTRmOWItOTAwZi1mYmVlYWE5ZGZmZjUiLCJpc3MiOiJodHRwczovL2tleWNsb2FrLmFhbS1kaWdpdGFsLm5ldC9yZWFsbXMvZGV2Iiwic3ViIjoiODQ0MGFkZDAtOTdhOS00M2VkLWFmMGItMTE2YzBmYWI3ZTkwIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiYXBwIiwibm9uY2UiOiI2N2I5N2U1NS1kMTY2LTQ3YjUtYTE4NC0zZDk1ZmIxMDQxM2UiLCJzZXNzaW9uX3N0YXRlIjoiZDZiYzQ2NTMtNmRmMC00M2NmLTliMWItNjgwODVmYTMyMTAzIiwic2NvcGUiOiJvcGVuaWQgZW1haWwiLCJzaWQiOiJkNmJjNDY1My02ZGYwLTQzY2YtOWIxYi02ODA4NWZhMzIxMDMiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIl9jb3VjaGRiLnJvbGVzIjpbInVzZXJfYXBwIl19.AK5qz9keozPFwBMl4xtBVt2T42AfkAdSvX5s6kSdZBdjfqnWazi3RB4YmQ-Rfik7z_uUhXayx2i72S557d3fo1G9YttLkormB2vZ-zM0GJeYXlGmG1jLUc8w3cQARdLBTrBsgWSGo2ZnZJ-eExn8UhwG5d5BUCl-IU-KJHB1C5R3sSTgXOpkED4WRaoxPOZORr40W263tHJjjNcPECUOtmpQvY0sGUbKHGWpqgWZNXE_G75DMHd0lEBeE924sIeEZcw0Y6TpjBwJULe89EVeI6sr4qhFKjNfn_2miB1HyOOM3jxUfUngR0ju0dJpm5Jmmcyr0Pah0QiA8OWVPKEZgQ\n";
    mockKeycloak.getToken.and.resolveTo(tokenWithoutUsername);
    return expectAsync(service.login()).toBeResolvedTo({
      name: "8440add0-97a9-43ed-af0b-116c0fab7e90",
      roles: ["user_app"],
    });
  });

  it("should call keycloak for a password reset", () => {
    service.changePassword();

    expect(mockKeycloak.login).toHaveBeenCalledWith(
      jasmine.objectContaining({ action: "UPDATE_PASSWORD" }),
    );
  });

  it("should add the Bearer token to a request", async () => {
    await service.login();

    const mapHeaders = new Map();
    service.addAuthHeader(mapHeaders);
    expect(mapHeaders.get("Authorization")).toBe(`Bearer ${keycloakToken}`);

    const objHeaders = {};
    service.addAuthHeader(objHeaders);
    expect(objHeaders["Authorization"]).toBe(`Bearer ${keycloakToken}`);
  });
});
