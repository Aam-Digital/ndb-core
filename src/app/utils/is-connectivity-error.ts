import { classifyErrorChain } from "#src/app/core/logging/error-classification";

/**
 * Check whether an error represents a transient network/connectivity failure:
 * a request that got no response, a gateway status (0, 502, 503, 504), or a
 * request cut off by a timeout or abort. Callers can layer additional
 * domain-specific checks on top.
 *
 * Failed requests to our backend and to Keycloak are converted into a
 * `ConnectivityError` where they enter the app (database layer, HTTP interceptor,
 * `KeycloakAuthService`), which is recognized also when wrapped (as `cause`).
 * A failed request to another service stays an `HttpErrorResponse`: check its
 * status (e.g. `0`) with `failedHttpResponse()` where needed.
 * A server error (500) is not a connectivity failure: the server was reached and failed.
 */
export function isConnectivityError(err: unknown): boolean {
  return classifyErrorChain(err) === "connectivity";
}
