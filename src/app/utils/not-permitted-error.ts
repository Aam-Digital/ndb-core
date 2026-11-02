import {
  causeChain,
  NotPermittedError,
} from "#src/app/core/logging/error-classification";

/**
 * Check whether a server error means the current user may not read or change the requested
 * record or type (e.g. a remote-only session loading a record the permission rules exclude):
 * a {@link NotPermittedError}, also when wrapped (as `cause`).
 *
 * This is a user / permission-configuration state, not an application error:
 * do not report it to remote monitoring; tell the user they don't have access instead.
 *
 * The database layer and the HTTP interceptor convert a `403`, and a `401` the server
 * explicitly calls "not permitted", into a `NotPermittedError`. An expired session
 * (see `isExpiredSessionError`) and other `401` reasons (e.g. an invalid token signature)
 * indicate other problems and must keep being reported.
 */
export function isNotPermittedError(err: unknown): boolean {
  return causeChain(err).some((error) => error instanceof NotPermittedError);
}
