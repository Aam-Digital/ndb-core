import {
  TypedError,
  TypedErrorOptions,
} from "#src/app/core/logging/error-classification";

/**
 * The server rejected the session (401), and it could not be renewed: thrown by
 * `RemotePouchDatabase` after a failed renewal, and converted from a 401
 * "exp not in future" by the database layer and the HTTP interceptor.
 */
export class SessionExpiredError extends TypedError {
  constructor(message: string, options?: TypedErrorOptions) {
    super("SessionExpiredError", "session-expired", message, options);
  }
}
