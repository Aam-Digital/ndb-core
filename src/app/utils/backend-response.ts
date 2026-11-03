import { HttpStatusCode } from "@angular/common/http";
import type { ErrorClassification } from "#src/app/core/logging/error-classification";

/**
 * What a failed request to our backend (CouchDB, the API) means, for the
 * boundaries converting it into a typed error (see `error-classification.ts`):
 * the HTTP interceptor and the database layer.
 */

/**
 * HTTP statuses of a request that never reached the application's backend:
 * `0` for one that got no response at all, the others reported by an
 * infrastructure component in front of it.
 */
export const CONNECTIVITY_ERROR_STATUS = new Set([0, 502, 503, 504]);

/** CouchDB's `reason` for rejecting a request whose JWT `exp` claim has passed. */
const EXPIRED_TOKEN_REASON = "exp not in future";

/** Text the permission backend uses when the current user may not access a document or type. */
const NOT_PERMITTED_TEXT = "not permitted";

/**
 * The classification of a failed response of our backend (the database or the
 * API), by its status and the texts the backend gave as reason.
 *
 * `undefined` for a status the caller handles itself (e.g. 400, 404) and for a
 * 5xx: whether it is the server failing is for the boundary to judge (PouchDB
 * uses 500 for failures of the local database as well).
 */
export function classifyResponseStatus(
  status: unknown,
  reasons: unknown[],
): Exclude<ErrorClassification, "local-storage" | "server-error"> | undefined {
  if (CONNECTIVITY_ERROR_STATUS.has(status as number)) {
    return "connectivity";
  }
  const texts = reasons
    .filter((text): text is string => typeof text === "string")
    .map((text) => text.toLowerCase());
  switch (status) {
    case HttpStatusCode.Unauthorized:
      if (texts.some((text) => text.includes(EXPIRED_TOKEN_REASON))) {
        return "session-expired";
      }
      // other 401 reasons (e.g. an invalid token signature) are misconfigurations
      return texts.some((text) => text.includes(NOT_PERMITTED_TEXT))
        ? "not-permitted"
        : undefined;
    case HttpStatusCode.Forbidden:
      return "not-permitted";
    case HttpStatusCode.Conflict:
      return "write-conflict";
    default:
      return undefined;
  }
}
