import { HttpStatusCode } from "@angular/common/http";

/**
 * CouchDB's `reason` for rejecting a request whose JWT `exp` claim has passed.
 */
const EXPIRED_TOKEN_REASON = "exp not in future";

/**
 * Check whether a database error is the server rejecting an expired access token.
 *
 * `RemotePouchDatabase` already retries such a request after renewing the
 * session, so this only reaches a caller when the renewal failed - usually
 * because the login server could not be reached. That is a transient state the
 * user is informed about, not an application error. Remote monitoring filters
 * it out centrally (see `processSentryEvent`), so callers can log and handle a
 * failed load as usual; use this only to tell the user the actual cause.
 *
 * Deliberately narrow: other `401` reasons (e.g. an invalid token signature)
 * indicate a misconfiguration and must keep being reported.
 */
export function isExpiredSessionError(err: any): boolean {
  return (
    err?.status === HttpStatusCode.Unauthorized &&
    typeof err?.reason === "string" &&
    err.reason.includes(EXPIRED_TOKEN_REASON)
  );
}
