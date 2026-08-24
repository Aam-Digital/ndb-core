/**
 * Common network/connectivity error patterns shared across the application.
 * These indicate transient failures (offline, DNS, proxy issues) rather than
 * application-level errors.
 */
const CONNECTIVITY_ERROR_PATTERNS = [
  "Failed to fetch", // Chrome (also matches DatabaseException "Failed to fetch from DB")
  "NetworkError", // Firefox ("NetworkError when attempting to fetch resource")
  "Load failed", // Safari
  "Network request failed",
  "network timeout",
  "0 Unknown Error", // Angular HttpErrorResponse for a request that never reached the server
];

/**
 * Error `name`s that browsers use for requests that were cut off before
 * completing, rather than answered with an error.
 */
export const CONNECTIVITY_ERROR_NAMES = ["TimeoutError", "AbortError"];

/**
 * Check whether an error *message* describes a transient network/connectivity
 * failure.
 *
 * Split out from {@link isConnectivityError} because remote monitoring only
 * ever sees errors in their serialized form (see the Sentry `beforeSend` hook
 * in `logging.service.ts`), and both must classify a failure the same way.
 */
export function isConnectivityErrorMessage(message: string): boolean {
  return CONNECTIVITY_ERROR_PATTERNS.some((pattern) =>
    message.includes(pattern),
  );
}

/**
 * Check whether an error represents a transient network/connectivity failure.
 *
 * Matches common browser fetch errors, timeout errors, and HTTP 5xx gateway
 * errors. Callers can layer additional domain-specific checks on top.
 */
export function isConnectivityError(err: any): boolean {
  if (!err) return false;
  // Check both `name` and `originalName`: a DatabaseException keeps its `name`
  // as "DatabaseException" for Sentry grouping but preserves the wrapped error's
  // name (e.g. "AbortError") in `originalName`.
  const names = [err?.name, err?.originalName];
  if (names.some((name) => CONNECTIVITY_ERROR_NAMES.includes(name))) {
    return true;
  }
  if ([0, 502, 503, 504].includes(err?.status)) return true;

  const message = `${err?.message ?? ""} ${err?.reason ?? ""} ${err?.toString?.() ?? ""}`;
  return isConnectivityErrorMessage(message);
}
