import {
  ErrorClassification,
  registerTypedError,
  TypedError,
  TypedErrorOptions,
} from "#src/app/core/logging/error-classification";

/**
 * The typed errors of a failed request to our backend (CouchDB, the API, Keycloak),
 * shared by the boundaries that convert such failures (the database layer, the
 * HTTP interceptor, the Keycloak service), see `backend-response.ts`.
 */

/** A request that never reached our backend (no response at all, or a gateway status). */
export class ConnectivityError extends TypedError {
  static readonly errorName = "ConnectivityError";
  static override readonly classification: ErrorClassification = "connectivity";

  constructor(message: string, options?: TypedErrorOptions) {
    super(ConnectivityError.errorName, message, options);
  }
}
registerTypedError(ConnectivityError);

/** Our backend answered with a 5xx status other than a gateway status. */
export class ServerError extends TypedError {
  static readonly errorName = "ServerError";
  static override readonly classification: ErrorClassification = "server-error";
  declare readonly status: number;

  constructor(
    message: string,
    options: TypedErrorOptions & { status: number },
  ) {
    super(ServerError.errorName, message, options);
  }
}
registerTypedError(ServerError);
