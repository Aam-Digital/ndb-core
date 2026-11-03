import { LoggedError, NamedError } from "./reported-errors";
import { CONNECTIVITY_ERROR_STATUS } from "#src/app/utils/backend-response";

/**
 * What kind of failure an error is, for reporting it: derived by
 * {@link classifyError}, from the error's type (one {@link TypedError} class per
 * classification). What remote monitoring does with each classification is in
 * `sentry-event-processing.ts` (`REPORTING_POLICY`).
 *
 * Errors are converted into typed errors where they enter the app: the database
 * layer (`DatabaseException` / `toTypedDatabaseError`, the remote database's
 * fetch wrapper) and the HTTP interceptor (`typedHttpErrorInterceptor`), using
 * `classifyResponseStatus` (`backend-response.ts`) and {@link classifyByPattern}. For a new kind of
 * error, extend one of the typed classes.
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
 * its class: a copy that PouchDB's replication makes of the error it failed
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
 * The name of `DatabaseException` (defined in `database-exception.ts`, which
 * depends on this file): it wraps the typed error that the raw error of the
 * database was converted into, and so has that error's classification.
 */
const DATABASE_EXCEPTION_NAME = "DatabaseException";

/**
 * Whether the name is that of a typed error: also for an error that lost its
 * class (see {@link TYPED_ERROR_NAMES}).
 */
export function isTypedErrorName(name: unknown): boolean {
  return TYPED_ERROR_NAMES.has(name as string);
}

/**
 * Error `name`s that browsers use for requests that were cut off before
 * completing, rather than answered with an error.
 */
const CONNECTIVITY_ERROR_NAMES = new Set(["TimeoutError", "AbortError"]);

/**
 * Wordings of a request that did not arrive, for errors that carry neither a
 * status nor a telling name (every browser words a failed `fetch` differently).
 */
const CONNECTIVITY_ERROR_PATTERNS = [
  "Failed to fetch", // Chrome
  "NetworkError", // Firefox ("NetworkError when attempting to fetch resource")
  "Load failed", // Safari
  "Network request failed",
  "network timeout",
  "0 Unknown Error", // Angular HttpErrorResponse for a request that never reached the server
  // A lazily loaded application chunk that could not be fetched: the device is
  // offline, or a new deployment replaced the chunk the running app asks for.
  // Chrome/Edge: "Failed to fetch dynamically imported module: <url>"
  // Firefox: "error loading dynamically imported module: <url>"
  "dynamically imported module",
  "Importing a module script failed", // Safari
];

/**
 * What counts as the device's local database being broken (`local-storage`):
 * nothing in our code to fix per occurrence, and once it happens every later
 * database access of the page load fails as well (see `report-once.ts`).
 */
const LOCAL_STORAGE_ERROR_NAMES = new Set([
  // PouchDB's "idb" adapter could not open or use IndexedDB
  "indexed_db_went_bad",
]);
const LOCAL_STORAGE_ERROR_PATTERNS = [
  // IndexedDB closed underneath PouchDB (e.g. by another tab upgrading it)
  "database connection is closing",
  // the IndexedDB has another schema than the adapter expects
  "object store was not found",
  'Incorrect adapter: you should specify the "idb" adapter',
  // Chrome failing to open the IndexedDB files on disk
  "Internal error opening backing store",
];

/**
 * Programming errors: in a local-storage call they still point to a bug (e.g. a
 * document too deeply nested to store), not to a broken database.
 */
const PROGRAMMING_ERROR_NAMES = new Set([
  "TypeError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
]);

/** PouchDB's wording of a rejected write, for errors that lost their 409 status. */
const WRITE_CONFLICT_TEXT = "document update conflict";

/**
 * What kind of failure the given error is, judged by this one error (not its `cause`s):
 * - a typed error by its class;
 * - a `DatabaseException` by the typed error it wraps as `cause`, if any;
 * - a foreign error by its status, name and message (see {@link classifyByPattern}).
 *
 * A {@link LoggedError} or another error of ours is never classified by its text.
 */
export function classifyError(error: unknown): ErrorClassification | undefined {
  if (!error || (typeof error !== "object" && typeof error !== "string")) {
    return undefined;
  }
  if (error instanceof NamedError && error.name === DATABASE_EXCEPTION_NAME) {
    return typedClassification(error.cause);
  }
  if (error instanceof LoggedError || error instanceof NamedError) {
    return typedClassification(error);
  }
  return classifyByPattern(error);
}

/**
 * The classification of the first error in the `cause` chain that has one,
 * outermost first: a boundary's typed error wins over the raw error it wraps.
 */
export function classifyErrorChain(
  error: unknown,
): ErrorClassification | undefined {
  for (const link of causeChain(error)) {
    const classification = classifyError(link);
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

type ErrorLike = {
  status?: unknown;
  response?: { status?: unknown };
  reason?: unknown;
  message?: unknown;
  name?: unknown;
};

/**
 * The classification of a foreign error by its connectivity status (0, 502-504),
 * its name and its wording:
 * - by the database boundary, for a raw error without a telling status
 *   (see `toTypedDatabaseError`);
 * - as fallback for foreign errors that never pass a boundary: unhandled browser
 *   errors (e.g. a failed `fetch` or chunk load), IndexedDB errors raised inside
 *   PouchDB's callbacks, keycloak-js errors (with the whole `Response` attached)
 *   and `HttpErrorResponse`s of third-party services (connectivity only: their
 *   other statuses mean something else);
 * - for errors that lost their class (see {@link TYPED_ERROR_NAMES}), by name.
 */
export function classifyByPattern(
  error: object | string,
): ErrorClassification | undefined {
  const err = error as ErrorLike;
  if (
    CONNECTIVITY_ERROR_STATUS.has(err.status as number) ||
    // keycloak-js hands on the whole `Response` instead of lifting the status out of it
    CONNECTIVITY_ERROR_STATUS.has(err.response?.status as number)
  ) {
    return "connectivity";
  }
  return classifyByName(err) ?? classifyByMessage(error);
}

function classifyByName(err: ErrorLike): ErrorClassification | undefined {
  const name = err.name as string;
  if (TYPED_ERROR_NAMES.has(name)) {
    return TYPED_ERROR_NAMES.get(name);
  }
  if (CONNECTIVITY_ERROR_NAMES.has(name)) {
    return "connectivity";
  }
  if (LOCAL_STORAGE_ERROR_NAMES.has(name)) {
    return "local-storage";
  }
  return undefined;
}

function textOf(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function classifyByMessage(
  error: object | string,
): ErrorClassification | undefined {
  const err = error as ErrorLike;
  // `name: message` like `Error.toString()`, which PouchDB errors (plain objects) lack
  const text =
    typeof error === "string"
      ? error
      : `${textOf(err.name)}: ${textOf(err.message)} ${textOf(err.reason)}`;
  if (CONNECTIVITY_ERROR_PATTERNS.some((pattern) => text.includes(pattern))) {
    return "connectivity";
  }
  // e.g. a replication checkpoint write rejected inside PouchDB
  if (text.toLowerCase().includes(WRITE_CONFLICT_TEXT)) {
    return "write-conflict";
  }
  const isProgrammingError = PROGRAMMING_ERROR_NAMES.has(err.name as string);
  if (
    !isProgrammingError &&
    LOCAL_STORAGE_ERROR_PATTERNS.some((pattern) => text.includes(pattern))
  ) {
    return "local-storage";
  }
  return undefined;
}
