import {
  ErrorClassification,
  registerTypedError,
  TypedError,
  TypedErrorOptions,
} from "#src/app/core/logging/error-classification";

/**
 * The permission rules do not allow the current user what was requested: our
 * backend answered 403, or 401 "not permitted" (converted by the database layer
 * and the HTTP interceptor, see `backend-response.ts`).
 */
export class NotPermittedError extends TypedError {
  static readonly errorName = "NotPermittedError";
  static override readonly classification: ErrorClassification =
    "not-permitted";

  constructor(message: string, options?: TypedErrorOptions) {
    super(NotPermittedError.errorName, message, options);
  }
}
registerTypedError(NotPermittedError);
