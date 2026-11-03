import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpRequest,
} from "@angular/common/http";
import { firstValueFrom, throwError } from "rxjs";
import { ConnectivityError, ServerError } from "#src/app/utils/backend-errors";
import { NotPermittedError } from "#src/app/core/permissions/not-permitted.error";
import { SessionExpiredError } from "#src/app/core/session/session-expired.error";
import { WriteConflictError } from "#src/app/core/database/pouchdb/database-errors";
import { typedHttpErrorInterceptor } from "./typed-http-error.interceptor";
import { failedHttpResponse } from "./failed-http-response";

/** The error a request to the url fails with through the interceptor. */
function failureOf(url: string, response: HttpErrorResponse) {
  const next: HttpHandlerFn = () => throwError(() => response);
  return firstValueFrom(
    typedHttpErrorInterceptor(new HttpRequest("GET", url), next),
  ).catch((err) => err);
}

describe("typedHttpErrorInterceptor", () => {
  it.each([
    [0, undefined, ConnectivityError],
    [504, undefined, ConnectivityError],
    [500, undefined, ServerError],
    [
      401,
      { error: "unauthorized", reason: "exp not in future" },
      SessionExpiredError,
    ],
    [
      401,
      {
        statusCode: 401,
        message: "unauthorized",
        error: "User is not permitted",
      },
      NotPermittedError,
    ],
    [403, { error: "forbidden" }, NotPermittedError],
    [409, { error: "conflict" }, WriteConflictError],
  ])(
    "should convert a %s response (%j) of the backend into its typed error",
    async (status, body, expectedType) => {
      const response = new HttpErrorResponse({ status, error: body });

      const failure = await failureOf("/api/v1/reporting", response);

      expect(failure).toBeInstanceOf(expectedType);
      expect(failure).toMatchObject({ status, cause: response });
      expect(failedHttpResponse(failure)).toBe(response);
    },
  );

  it("should keep the url and its query out of the typed error's message", async () => {
    const url =
      "/api/v1/skill/user-profile?fullName=Jane+Doe&email=jane%40example.org";
    const response = new HttpErrorResponse({ status: 500, url });

    const failure = await failureOf(url, response);

    expect(failure).toBeInstanceOf(ServerError);
    expect(failure.message).not.toContain("user-profile");
    expect(failure.message).not.toContain("Jane");
    expect(failure.details).toMatchObject({
      url: "/api/v1/skill/user-profile",
      method: "GET",
    });
  });

  it.each([
    ["an unclassified status of the backend", "/db/app/Child:1", 404],
    ["another 401 of the backend", "/db/app/Child:1", 401],
    ["a response of another service", "https://nominatim.example/search", 403],
    ["a response of another service", "https://keycloak.example/admin", 0],
    ["a response of another service", "https://esco.example/resource", 500],
  ])("should leave %s unchanged", async (_, url, status) => {
    const response = new HttpErrorResponse({ status, url });

    expect(await failureOf(url, response)).toBe(response);
  });
});
