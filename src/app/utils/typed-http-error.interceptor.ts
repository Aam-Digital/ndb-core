import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from "@angular/common/http";
import { catchError, throwError } from "rxjs";
import { environment } from "#src/environments/environment";
import {
  ErrorClassification,
  TypedError,
  TypedErrorOptions,
} from "#src/app/core/logging/error-classification";
import { NotPermittedError } from "#src/app/core/permissions/not-permitted.error";
import { SessionExpiredError } from "#src/app/core/session/session-expired.error";
import { WriteConflictError } from "#src/app/core/database/pouchdb/database-errors";
import {
  classifyResponseStatus,
  normalizeRequestPath,
} from "./backend-response";
import { ConnectivityError, ServerError } from "./backend-errors";

/**
 * Where failed responses of our own backend (the database and API proxies)
 * enter the app through `HttpClient`: a classified failure is converted into
 * its typed error (see {@link TYPED_HTTP_ERRORS}), with the `HttpErrorResponse`
 * as its `cause` and its `status` kept.
 *
 * Other failures (e.g. a 400 or 404 the caller handles) stay an `HttpErrorResponse`,
 * as do responses of other services (Keycloak, the address lookup, ...),
 * whose statuses mean something else and which their callers handle themselves.
 * Callers read the response (e.g. its body) of either with `failedHttpResponse()`.
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
 * The typed error of each classification, and its message. Static, as the
 * message of a classified error is its issue title and grouping key: the url
 * (with ids and query parameters, which may hold personal data) goes into the
 * error's `details`, without the query (and as `requestPath` with ids masked,
 * which tells server errors of different endpoints apart).
 */
const TYPED_HTTP_ERRORS: Record<
  HttpErrorClassification,
  {
    type: new (message: string, options: TypedErrorOptions) => TypedError;
    message: string;
  }
> = {
  connectivity: { type: ConnectivityError, message: "Failed to fetch from" },
  "server-error": { type: ServerError, message: "Server error response from" },
  "not-permitted": {
    type: NotPermittedError,
    message: "Request not permitted by",
  },
  "session-expired": {
    type: SessionExpiredError,
    message: "Session expired for request to",
  },
  "write-conflict": {
    type: WriteConflictError,
    message: "Write conflict response from",
  },
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
  const { type, message } = TYPED_HTTP_ERRORS[classification];
  return new type(`${message} ${target}`, {
    status: error.status,
    cause: error,
    details: {
      url,
      requestPath: normalizeRequestPath(url),
      method: request.method,
      statusText: error.statusText,
    },
  });
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
