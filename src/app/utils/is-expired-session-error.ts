import { classifyErrorChain } from "#src/app/core/logging/error-classification";

/**
 * Check whether an error is the server rejecting an expired session:
 * a `SessionExpiredError`, also when wrapped (as `cause`), see `classifyErrorChain`.
 *
 * `RemotePouchDatabase` retries a rejected request after renewing the session,
 * and fails with this only if the renewal failed - usually because the login
 * server could not be reached. The database layer and the HTTP interceptor also
 * convert a `401` with the reason "exp not in future" into it. That is a transient
 * state the user is informed about, not an application error. Remote monitoring
 * filters it out centrally (see `processSentryEvent`), so callers can log and
 * handle a failed load as usual; use this only to tell the user the actual cause.
 *
 * Deliberately narrow: other `401` reasons (e.g. an invalid token signature)
 * indicate a misconfiguration and must keep being reported.
 */
export function isExpiredSessionError(err: unknown): boolean {
  return classifyErrorChain(err) === "session-expired";
}
