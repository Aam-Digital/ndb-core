import { classifyError } from "#src/app/core/logging/error-classification";

/**
 * Check whether an error represents a transient network/connectivity failure:
 * a request that got no response, a gateway status (0, 502, 503, 504), or a
 * request cut off by a timeout or abort. Callers can layer additional
 * domain-specific checks on top.
 *
 * Errors created at a boundary (e.g. `ConnectivityError` of the remote database)
 * are recognized by their type; raw browser errors by their status, name or
 * wording (see `error-classification.ts`). A server error (500) is not a
 * connectivity failure: the server was reached and failed.
 */
export function isConnectivityError(err: unknown): boolean {
  return classifyError(err) === "connectivity";
}
