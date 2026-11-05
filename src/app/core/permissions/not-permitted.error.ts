import {
  TypedError,
  TypedErrorOptions,
} from "#src/app/core/logging/error-classification";

/**
 * The permission rules do not allow the current user what was requested: our
 * backend answered 403, or 401 "not permitted" (converted by the database layer
 * and the HTTP interceptor, see `backend-response.ts`), or any 401 to a session
 * without login (e.g. a public form, see `RemotePouchDatabase`).
 */
export class NotPermittedError extends TypedError {
  constructor(message: string, options?: TypedErrorOptions) {
    super("NotPermittedError", "not-permitted", message, options);
  }
}
