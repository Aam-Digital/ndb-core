/**
 * Common network/connectivity error patterns shared across the application.
 * These indicate transient failures (offline, DNS, proxy issues) rather than
 * application-level errors.
 */
const CONNECTIVITY_ERROR_PATTERNS = [
  "Failed to fetch",
  "NetworkError",
  "Load failed",
  "Network request failed",
  "network timeout",
];

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
  if (names.includes("TimeoutError") || names.includes("AbortError")) {
    return true;
  }
  if ([0, 502, 503, 504].includes(err?.status)) return true;

  const message = `${err?.message ?? ""} ${err?.reason ?? ""} ${err?.toString?.() ?? ""}`;
  return CONNECTIVITY_ERROR_PATTERNS.some((pattern) =>
    message.includes(pattern),
  );
}
