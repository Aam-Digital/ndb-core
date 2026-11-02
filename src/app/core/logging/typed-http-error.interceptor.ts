import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { catchError, throwError } from "rxjs";
import { environment } from "#src/environments/environment";
import {
  causeChain,
  classifyResponseStatus,
  createTypedError,
  ErrorClassification,
} from "./error-classification";

/**
 * Where failed responses of our own backend (the database and API proxies)
 * enter the app through `HttpClient`: a classified failure is converted into
 * its typed error (see `error-classification.ts`), with the `HttpErrorResponse`
 * as its `cause` and its `status` kept.
 *
 * Other failures (e.g. a 400 or 404 the caller handles) stay an `HttpErrorResponse`,
 * as do responses of other services (Keycloak, the address lookup, ...),
 * whose statuses mean something else and which their callers handle themselves.
 * Use {@link failedHttpResponse} to read the response (e.g. its body) of either.
 */
export const typedHttpErrorInterceptor: HttpInterceptorFn = (request, next) =>
  isBackendRequest(request.url)
    ? next(request).pipe(
        catchError((err) => throwError(() => toTypedHttpError(err))),
      )
    : next(request);

function isBackendRequest(url: string): boolean {
  return [environment.DB_PROXY_PREFIX, environment.API_PROXY_PREFIX].some(
    (prefix) => url === prefix || url.startsWith(prefix + "/"),
  );
}

/** The typed error of a failed response of our backend (see {@link typedHttpErrorInterceptor}). */
export function toTypedHttpError(error: unknown): unknown {
  if (!(error instanceof HttpErrorResponse)) {
    return error;
  }
  const classification = classifyHttpError(error);
  if (!classification) {
    return error;
  }
  return createTypedError(classification, error.message, {
    status: error.status,
    cause: error,
  });
}

function classifyHttpError(
  error: HttpErrorResponse,
): ErrorClassification | undefined {
  const body: { reason?: unknown; error?: unknown; message?: unknown } =
    typeof error.error === "object" ? (error.error ?? {}) : {};
  const reasons = [body.reason, body.error, body.message, error.error];
  const classification = classifyResponseStatus(error.status, reasons);
  if (classification) {
    return classification;
  }
  return error.status >= 500 ? "server-error" : undefined;
}

/**
 * The failed response of an `HttpClient` request, whether the error is the
 * `HttpErrorResponse` itself or the typed error it was converted into
 * (see {@link typedHttpErrorInterceptor}).
 */
export function failedHttpResponse(
  error: unknown,
): HttpErrorResponse | undefined {
  return causeChain(error).find(
    (link): link is HttpErrorResponse => link instanceof HttpErrorResponse,
  );
}
