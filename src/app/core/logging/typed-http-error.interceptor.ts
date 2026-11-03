import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from "@angular/common/http";
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
        catchError((err) => throwError(() => toTypedHttpError(err, request))),
      )
    : next(request);

function isBackendRequest(url: string): boolean {
  return [environment.DB_PROXY_PREFIX, environment.API_PROXY_PREFIX].some(
    (prefix) => url === prefix || url.startsWith(prefix + "/"),
  );
}

type HttpErrorClassification = Exclude<ErrorClassification, "local-storage">;

/**
 * The message of the typed error of each classification. Static, as the
 * message of a classified error is its issue title and grouping key: the url
 * (with ids and query parameters, which may hold personal data) goes into the
 * error's `details`, without the query.
 */
const TYPED_HTTP_ERROR_MESSAGES: Record<HttpErrorClassification, string> = {
  connectivity: "Failed to fetch from",
  "server-error": "Server error response from",
  "not-permitted": "Request not permitted by",
  "session-expired": "Session expired for request to",
  "write-conflict": "Write conflict response from",
};

/** The typed error of a failed response of our backend (see {@link typedHttpErrorInterceptor}). */
export function toTypedHttpError(
  error: unknown,
  request: Pick<HttpRequest<unknown>, "method" | "url">,
): unknown {
  if (!(error instanceof HttpErrorResponse)) {
    return error;
  }
  const classification = classifyHttpError(error);
  if (!classification) {
    return error;
  }
  const url = request.url.split(/[?#]/)[0];
  const target = url.startsWith(environment.DB_PROXY_PREFIX) ? "DB" : "API";
  return createTypedError(
    classification,
    `${TYPED_HTTP_ERROR_MESSAGES[classification]} ${target}`,
    {
      status: error.status,
      cause: error,
      details: { url, method: request.method, statusText: error.statusText },
    },
  );
}

function classifyHttpError(
  error: HttpErrorResponse,
): HttpErrorClassification | undefined {
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
