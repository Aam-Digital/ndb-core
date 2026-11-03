import { HttpErrorResponse } from "@angular/common/http";
import { defer, firstValueFrom, throwError } from "rxjs";
import { retryOnServerError } from "./retry-on-server-error.rxjs-pipe";
import { toTypedHttpError } from "#src/app/core/logging/typed-http-error.interceptor";

describe("retryOnServerError", () => {
  afterEach(() => vi.useRealTimers());

  it.each([
    [
      "a 5xx of another service (an HttpErrorResponse)",
      3,
      new HttpErrorResponse({ status: 500 }),
    ],
    [
      "a 5xx of our backend (converted into a typed error)",
      3,
      toTypedHttpError(new HttpErrorResponse({ status: 500 }), {
        method: "GET",
        url: "/api/v1/skill/user-profile",
      }),
    ],
    ["a 4xx", 1, new HttpErrorResponse({ status: 404 })],
  ])(
    "tries a request failing with %s %i times in total",
    async (_, expectedAttempts, error) => {
      vi.useFakeTimers();
      let attempts = 0;
      const request = defer(() => {
        attempts++;
        return throwError(() => error);
      });

      const result = firstValueFrom(request.pipe(retryOnServerError(2))).catch(
        (err) => err,
      );
      await vi.runAllTimersAsync();

      expect(await result).toBe(error);
      expect(attempts).toBe(expectedAttempts);
    },
  );
});
