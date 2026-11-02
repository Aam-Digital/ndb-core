import { classifyError } from "#src/app/core/logging/error-classification";

/**
 * Check whether a server error means the current user may not read or change the requested
 * record or type (e.g. a remote-only session loading a record the permission rules exclude).
 *
 * This is a user / permission-configuration state, not an application error:
 * do not report it to remote monitoring; tell the user they don't have access instead.
 *
 * - `403` is always "not permitted".
 * - `401` only counts when the server says so explicitly ("User is not permitted").
 *   An expired session (see `isExpiredSessionError`) and other `401` reasons
 *   (e.g. an invalid token signature) indicate other problems and must keep being reported.
 */
export function isNotPermittedError(err: unknown): boolean {
  return classifyError(err) === "not-permitted";
}
