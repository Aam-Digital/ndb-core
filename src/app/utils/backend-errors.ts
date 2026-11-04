import {
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
  constructor(message: string, options?: TypedErrorOptions) {
    super("ConnectivityError", "connectivity", message, options);
  }
}

/** Our backend answered with a 5xx status other than a gateway status. */
export class ServerError extends TypedError {
  declare readonly status: number;

  constructor(
    message: string,
    options: TypedErrorOptions & { status: number },
  ) {
    super("ServerError", "server-error", message, options);
  }
}
