import { HttpErrorResponse } from "@angular/common/http";
import { causeChain } from "#src/app/core/logging/error-classification";

/**
 * The failed response of an `HttpClient` request, to read its `status` or body.
 *
 * Failures of requests to our backend (`/db`, `/api`) may arrive as a typed error
 * (e.g. a `ServerError`) instead of the `HttpErrorResponse`, which is then its
 * `cause` (see `typedHttpErrorInterceptor`). This finds the response in either case,
 * so use it instead of `instanceof HttpErrorResponse`.
 */
export function failedHttpResponse(
  error: unknown,
): HttpErrorResponse | undefined {
  return causeChain(error).find(
    (link): link is HttpErrorResponse => link instanceof HttpErrorResponse,
  );
}
