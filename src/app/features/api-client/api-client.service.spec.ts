import { TestBed } from "@angular/core/testing";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable, of, throwError } from "rxjs";
import type { Mock } from "vitest";
import { environment } from "#src/environments/environment";
import { ApiClientService, errorMessageOf } from "./api-client.service";

describe("ApiClientService", () => {
  let mockHttpClient: { get: Mock };
  let originalKeycloakConfig: Pick<
    typeof environment,
    "userAdminApi" | "realm"
  >;

  beforeEach(() => {
    originalKeycloakConfig = {
      userAdminApi: environment.userAdminApi,
      realm: environment.realm,
    };
    mockHttpClient = { get: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: HttpClient, useValue: mockHttpClient }],
    });
  });

  afterEach(() => Object.assign(environment, originalKeycloakConfig));

  it.each<[string, Observable<unknown>, boolean]>([
    [
      "enables it",
      of({ admin: { enabled: true, "api-client": { enabled: true } } }),
      true,
    ],
    ["has no Keycloak admin access", of({ admin: { enabled: true } }), false],
    ["does not enable it", of({ reporting: { enabled: true } }), false],
    [
      "is not deployed",
      throwError(() => new HttpErrorResponse({ status: 504 })),
      false,
    ],
  ])(
    "offers API client management only if the backend %s",
    async (_, featuresResponse, expected) => {
      mockHttpClient.get.mockReturnValue(featuresResponse);
      const service = TestBed.inject(ApiClientService);

      TestBed.tick();
      await vi.waitFor(() =>
        expect(mockHttpClient.get).toHaveBeenCalledWith(
          environment.API_PROXY_PREFIX + "/actuator/features",
        ),
      );
      await new Promise((resolve) => setTimeout(resolve));

      expect(service.isAvailable()).toBe(expected);
    },
  );

  it("gives the external system everything it needs to get tokens and call the API", () => {
    mockHttpClient.get.mockReturnValue(of({}));
    environment.userAdminApi = "https://keycloak.example.com/";
    environment.realm = "my-realm";
    const service = TestBed.inject(ApiClientService);

    const text = service.formatForSharing(
      { clientId: "api-tola-x7k2pq", clientSecret: "s3cret" },
      ["reporting_read", "reporting_write"],
    );

    expect(text).toContain(
      "https://keycloak.example.com/realms/my-realm/protocol/openid-connect/token",
    );
    expect(text).toContain(
      window.location.origin + environment.API_PROXY_PREFIX,
    );
    expect(text).toContain("api-tola-x7k2pq");
    expect(text).toContain("s3cret");
    expect(text).toContain("reporting_read reporting_write");
    // both reporting scopes share their documentation
    expect(text.match(/docs\/modules\/reporting\.md/g)).toHaveLength(1);
  });

  it.each([
    [
      "a network failure",
      new HttpErrorResponse({ status: 0 }),
      "Could not connect to the server",
    ],
    [
      "a failure the backend explains",
      new HttpErrorResponse({
        status: 400,
        error: {
          errorCode: "INVALID_NAME",
          errorMessage:
            "The name of an API client must have 1 to 100 characters",
        },
      }),
      "must have 1 to 100 characters",
    ],
    [
      "an unexplained failure",
      new HttpErrorResponse({ status: 500 }),
      "contact support",
    ],
  ])("explains %s to the user", (_, error, expectedMessage) => {
    expect(errorMessageOf(error)).toContain(expectedMessage);
  });
});
