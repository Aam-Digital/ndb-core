/**
 * What kind of failure an error is, as far as reporting it is concerned.
 * Set where errors enter the app (see `error-classification.ts`), and mapped to
 * what remote monitoring does with it in `sentry-event-processing.ts`.
 */
export type ErrorClassification =
  /** the request never reached our backend: no response, status 0, 502-504 */
  | "connectivity"
  /** 401 for an expired token that could not be renewed */
  | "session-expired"
  /** 403, or 401 "User is not permitted": the permission rules exclude the user */
  | "not-permitted"
  /** the device's local database (IndexedDB / PouchDB) is broken */
  | "local-storage"
  /** our backend answered with a 5xx other than a gateway status */
  | "server-error"
  /** a rejected write with an outdated revision (409) */
  | "write-conflict";

/**
 * An error of ours whose name and message identify the problem on their own,
 * no matter which component or call site ran into it.
 *
 * Remote monitoring groups it by name, message and root cause instead of by
 * stack trace, and reports its `details` as extra data (see the logging README).
 * Pass the name as a literal: the class name is minified in production builds.
 */
export class NamedError extends Error {
  /** Context for the report, kept out of the message so that it does not split the issue. */
  readonly details?: Record<string, unknown>;

  /** What kind of failure this is, if known where it was created (see `classifyError`). */
  readonly classification?: ErrorClassification;

  constructor(
    name: string,
    message: string,
    options?: {
      cause?: unknown;
      details?: Record<string, unknown>;
      classification?: ErrorClassification;
    },
  ) {
    super(
      message,
      options?.cause === undefined ? undefined : { cause: options.cause },
    );
    this.name = name;
    this.details = options?.details;
    if (options?.classification) {
      this.classification = options.classification;
    }
  }
}

/**
 * What `Logging.error(message, err)` / `Logging.warn(message, err)` report:
 * the logged message as the error, with the logged error as its `cause`.
 *
 * Named "Error", so that titles read "Error: <message>"; remote monitoring
 * recognizes it by class instead.
 */
export class LoggedError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "Error";
  }
}
