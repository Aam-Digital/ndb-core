import { MonoTypeOperatorFunction, timer } from "rxjs";
import { retry } from "rxjs/operators";
import { failedHttpResponse } from "./failed-http-response";

/**
 * Retry an `HttpClient` request on server error (status code 5xx),
 * whether the failure is an `HttpErrorResponse` or the typed error our backend's
 * failures are converted into (see {@link failedHttpResponse}).
 * Use this in `pipe(retryOnServerError(2))`.
 *
 * Retries are done with exponential backoff delays
 * that are randomized (in case there are many parallel requests to be spread out).
 */
export function retryOnServerError<T>(
  maxRetries: number,
): MonoTypeOperatorFunction<T> {
  return retry({
    count: maxRetries,
    delay: (error: unknown, retryCount: number) => {
      if (failedHttpResponse(error)?.status >= 500) {
        return timer(random(250, 750) * Math.pow(2, retryCount - 1)); // exponential backoff
      } else {
        throw error;
      }
    },
  });
}

function random(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
