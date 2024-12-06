import { HttpErrorResponse } from "@angular/common/http";
import { MonoTypeOperatorFunction, timer } from "rxjs";
import { retry } from "rxjs/operators";

/**
 * Retry a request on server error (status code 5xx).
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
    delay: (error: HttpErrorResponse, retryCount: number) => {
      if (error.status >= 500) {
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
