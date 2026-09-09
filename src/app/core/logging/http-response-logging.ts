import { HttpStatusCode } from "@angular/common/http";

/**
 * Helpers to turn an HTTP response into something worth reporting.
 *
 * These live with the logging module rather than with the code that makes the
 * requests: what they encode is how remote monitoring groups and titles an
 * issue, not how the database talks to CouchDB.
 */

/**
 * Names for the response statuses that are reported to remote monitoring.
 *
 * Monitoring groups a reported message by its normalized text, and that
 * normalization masks numbers (see `fingerprintKey`), so a status interpolated
 * as a number would collapse every unexpected response into one issue - the
 * mixed bucket this exists to prevent. In AAM-DIGITAL-77H a rejected write, a
 * malformed query and a replication checkpoint read all shared one title, and
 * none of them could be told apart or triaged. Naming the status keeps the
 * message text static (as the logging conventions require) while giving each
 * root cause its own issue and a title that says what happened.
 *
 * Only statuses that plausibly occur are listed, because each one here should
 * mean a different response:
 *  - 400 a malformed request (a bad query, or a proxy mangling the url)
 *  - 413 a payload over the reverse proxy's limit, e.g. a large attachment
 *  - 429 throttling
 * Anything else shares one bucket via {@link unexpectedResponseMessage} and is
 * still reported with its numeric status in the logged context.
 */
const UNEXPECTED_STATUS_NAMES: Record<number, string> = {
  [HttpStatusCode.BadRequest]: "bad request",
  [HttpStatusCode.PayloadTooLarge]: "payload too large",
  [HttpStatusCode.TooManyRequests]: "too many requests",
};

/**
 * The message to report for an unexpected response from a database request.
 *
 * Deliberately says "response" rather than "fetch": one code path carries both
 * reads and writes, and calling a rejected write a failed fetch is what sent
 * the first analysis of AAM-DIGITAL-77H down the wrong path.
 *
 * The fallback is digit-free so that it is not mangled by the number masking
 * described on {@link UNEXPECTED_STATUS_NAMES}.
 */
export function unexpectedResponseMessage(status: number): string {
  return `Unexpected DB response: ${UNEXPECTED_STATUS_NAMES[status] ?? "unnamed client error"}`;
}

/**
 * Extract the diagnostic fields of a fetch `Response` into a plain object.
 *
 * `Response` keeps its state in internal slots rather than own enumerable
 * properties, so passing one to the logger (or to `JSON.stringify`) yields an
 * empty object - the reported event then carries no status at all, which is the
 * one thing needed to tell e.g. a conflict from a rate limit
 * (see AAM-DIGITAL-77H, whose `context` reads `[{}]` for every event).
 *
 * The `method` is not part of the `Response` and has to be passed in, but it
 * decides how a report should be read: the same status means different things
 * for a read and for a write (a 409 on a `PUT` is a rejected save, on a
 * `_local` checkpoint it is replication housekeeping), so without it an event
 * cannot be classified at all - which is why the AAM-DIGITAL-77H events from
 * before this was recorded remain unclassifiable.
 */
export function describeResponse(
  response: Response | undefined,
  method?: string,
): {
  method?: string;
  status?: number;
  statusText?: string;
  responseUrl?: string;
} {
  if (!response) {
    return { method };
  }
  return {
    method,
    status: response.status,
    statusText: response.statusText,
    responseUrl: response.url,
  };
}
