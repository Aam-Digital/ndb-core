import { LoggedError, NamedError } from "./reported-errors";

/**
 * What kind of failure an error is, for reporting it: derived by
 * {@link classifyError} from the error's type (one {@link TypedError} class per
 * classification). What remote monitoring does with each classification is in
 * `sentry-event-processing.ts` (`REPORTING_POLICY`).
 *
 * Foreign errors are converted into typed errors where they enter the app (the
 * database layer, the HTTP interceptor, the Keycloak service), by the knowledge
 * of the module they belong to. For a new kind of error, extend one of the
 * typed classes.
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

/** What a typed error of a boundary keeps of the failure it was converted from. */
export interface TypedErrorOptions {
  /** the HTTP status of the failed request */
  status?: number;
  /** the original (foreign) error */
  cause?: unknown;
  details?: Record<string, unknown>;
}

/**
 * A failure of a known kind, converted from a foreign error where it entered
 * the app: its class is its classification (see {@link ErrorClassification}).
 */
export abstract class TypedError extends NamedError {
  /** The HTTP status of the failed request, if any. */
  readonly status?: number;

  protected constructor(
    name: string,
    message: string,
    options?: TypedErrorOptions,
  ) {
    super(name, message, options);
    this.status = options?.status;
  }
}

/** A request that never reached our backend (no response at all, or a gateway status). */
export class ConnectivityError extends TypedError {
  static readonly errorName = "ConnectivityError";
  constructor(message: string, options?: TypedErrorOptions) {
    super(ConnectivityError.errorName, message, options);
  }
}

/** Our backend answered with a 5xx status other than a gateway status. */
export class ServerError extends TypedError {
  static readonly errorName = "ServerError";
  declare readonly status: number;

  constructor(
    message: string,
    options: TypedErrorOptions & { status: number },
  ) {
    super(ServerError.errorName, message, options);
  }
}

/** The permission rules do not allow the current user what was requested (403, or 401 "not permitted"). */
export class NotPermittedError extends TypedError {
  static readonly errorName = "NotPermittedError";
  constructor(message: string, options?: TypedErrorOptions) {
    super(NotPermittedError.errorName, message, options);
  }
}

/** The server rejected the session (401), and it could not be renewed. */
export class SessionExpiredError extends TypedError {
  static readonly errorName = "SessionExpiredError";
  constructor(message: string, options?: TypedErrorOptions) {
    super(SessionExpiredError.errorName, message, options);
  }
}

/** A write was rejected because the document has changed in the meantime (409). */
export class WriteConflictError extends TypedError {
  static readonly errorName = "WriteConflictError";
  constructor(message: string, options?: TypedErrorOptions) {
    super(WriteConflictError.errorName, message, options);
  }
}

/** The device's local database (IndexedDB underneath PouchDB) is broken. */
export class LocalStorageError extends TypedError {
  static readonly errorName = "LocalStorageError";
  constructor(message: string, options?: TypedErrorOptions) {
    super(LocalStorageError.errorName, message, options);
  }
}

type TypedErrorClass = {
  new (message: string, options: TypedErrorOptions): TypedError;
  /** the error's `name`, as a literal: class names are minified */
  readonly errorName: string;
};

/** The typed error of each classification. */
const TYPED_ERRORS: Record<ErrorClassification, TypedErrorClass> = {
  connectivity: ConnectivityError,
  "server-error": ServerError,
  "not-permitted": NotPermittedError,
  "session-expired": SessionExpiredError,
  "write-conflict": WriteConflictError,
  "local-storage": LocalStorageError,
};

/**
 * The classifications by the names of the typed errors, for an error that lost
 * its class: a copy that PouchDB's `createError()` makes of the error it failed
 * with, or an exception of a Sentry event without the original error object.
 */
const TYPED_ERROR_NAMES = new Map<string, ErrorClassification>(
  Object.entries(TYPED_ERRORS).map(([classification, type]) => [
    type.errorName,
    classification as ErrorClassification,
  ]),
);

/**
 * Create the typed error of a classification, for a boundary converting a
 * foreign error (keep that one as `cause`, and its `status`).
 */
export function createTypedError(
  classification: ErrorClassification,
  message: string,
  options: TypedErrorOptions,
): TypedError {
  return new TYPED_ERRORS[classification](message, options);
}

/** Whether the name is that of a typed error, also of one that lost its class. */
export function isTypedErrorName(name: unknown): boolean {
  return TYPED_ERROR_NAMES.has(name as string);
}

/**
 * The name of `DatabaseException` (defined in `database-exception.ts`, which
 * depends on this file): it wraps the typed error that the raw error of the
 * database was converted into, and so has that error's classification.
 */
const DATABASE_EXCEPTION_NAME = "DatabaseException";

/**
 * What kind of failure the given error is, judged by this one error (not its `cause`s):
 * - a typed error by its class, or by its name if it lost its class;
 * - a `DatabaseException` by the typed error it wraps as `cause`, if any.
 *
 * Any other error is not classified: foreign errors are converted where they
 * enter the app, never recognized by their wording here.
 */
export function classifyError(error: unknown): ErrorClassification | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }
  if (error instanceof NamedError && error.name === DATABASE_EXCEPTION_NAME) {
    return typedClassification(error.cause);
  }
  if (error instanceof LoggedError || error instanceof NamedError) {
    return typedClassification(error);
  }
  return TYPED_ERROR_NAMES.get((error as { name?: unknown }).name as string);
}

/** The classification of a typed error, by its class. */
function typedClassification(error: unknown): ErrorClassification | undefined {
  if (!(error instanceof TypedError)) {
    return undefined;
  }
  return (Object.keys(TYPED_ERRORS) as ErrorClassification[]).find(
    (classification) => error instanceof TYPED_ERRORS[classification],
  );
}

/**
 * The classification of the first error in the `cause` chain that has one,
 * outermost first: a boundary's typed error wins over the raw error it wraps.
 *
 * @param classify how to classify each error of the chain (remote monitoring
 *   adds the foreign errors that reach it unconverted)
 */
export function classifyErrorChain(
  error: unknown,
  classify: (error: unknown) => ErrorClassification | undefined = classifyError,
): ErrorClassification | undefined {
  for (const link of causeChain(error)) {
    const classification = classify(link);
    if (classification) {
      return classification;
    }
  }
  return undefined;
}

/** The error and the `cause`s it wraps, outermost first (cycle-safe, max 6 levels). */
export function causeChain(error: unknown): unknown[] {
  const chain: unknown[] = [];
  let current = error;
  while (
    current &&
    (typeof current === "object" || typeof current === "string") &&
    !chain.includes(current) &&
    chain.length <= 5
  ) {
    chain.push(current);
    current = (current as { cause?: unknown }).cause;
  }
  return chain;
}
