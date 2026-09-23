/**
 * Wordings for a lazily loaded application chunk that could not be fetched.
 *
 * These are requests that did not arrive, like any other connectivity failure:
 * the device is offline, or a new deployment replaced the chunk that the
 * still-running app asks for. Which of the two it was is not visible from the
 * error, and neither is actionable per chunk - so they belong in the shared
 * network issue rather than in one issue per chunk URL and browser wording.
 */
const CHUNK_LOAD_ERROR_PATTERNS = [
  // Chrome/Edge: "Failed to fetch dynamically imported module: <url>"
  // Firefox: "error loading dynamically imported module: <url>"
  "dynamically imported module",
  "Importing a module script failed", // Safari
];

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
  ...CHUNK_LOAD_ERROR_PATTERNS,
];

/**
 * Error `name`s that browsers use for requests that were cut off before
 * completing, rather than answered with an error.
 */
export const CONNECTIVITY_ERROR_NAMES = ["TimeoutError", "AbortError"];

/**
 * HTTP statuses of a request that never reached the application's backend:
 * `0` for one that got no response at all, the others reported by an
 * infrastructure component in front of it.
 */
export const CONNECTIVITY_ERROR_STATUS = [0, 502, 503, 504];

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
  // `err.response.status` as well as `err.status`: a library that wraps `fetch`
  // may hand on the whole `Response` instead of lifting the status out of it
  // (keycloak-js does, see `NetworkError`), and a gateway failure is the same
  // problem whichever shape it arrives in
  if (
    CONNECTIVITY_ERROR_STATUS.includes(err?.status) ||
    CONNECTIVITY_ERROR_STATUS.includes(err?.response?.status)
  ) {
    return true;
  }

  const message = `${err?.message ?? ""} ${err?.reason ?? ""} ${err?.toString?.() ?? ""}`;
  return isConnectivityErrorMessage(message);
}
