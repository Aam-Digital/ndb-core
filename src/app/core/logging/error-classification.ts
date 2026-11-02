import { HttpStatusCode } from "@angular/common/http";
import { LoggedError, NamedError } from "./reported-errors";

/**
 * What kind of failure an error is, for reporting it.
 *
 * Errors are converted into our typed errors where they enter the app: the
 * database layer (`DatabaseException` / `toTypedDatabaseError`, the remote
 * database's fetch wrapper) and the HTTP interceptor (`typedHttpErrorInterceptor`).
 * There, {@link classifyResponseStatus} and the name and message patterns below
 * tell what a raw error is. Everywhere else, errors are classified by their type;
 * for a new kind of error, extend one of the typed classes.
 *
 * {@link classifyError} only falls back to the patterns for foreign errors that
 * never pass such a boundary (see {@link classifyForeignError}).
 *
 * What remote monitoring does with each classification is in
 * `sentry-event-processing.ts` (`REPORTING_POLICY`).
 */

/**
 * What kind of failure an error is, as far as reporting it is concerned:
 * derived by {@link classifyError}, mostly from the error's type (one typed
 * error class per classification). Mapped to what remote monitoring does with
 * it in `sentry-event-processing.ts`.
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

/** A request that never reached our backend (no response at all, or a gateway status). */
export class ConnectivityError extends NamedError {
  constructor(message: string, options?: TypedErrorOptions) {
    super("ConnectivityError", message, options);
  }
}

/** Our backend answered with a 5xx status other than a gateway status. */
export class ServerError extends NamedError {
  declare readonly status: number;

  constructor(
    message: string,
    options: TypedErrorOptions & { status: number },
  ) {
    super("ServerError", message, options);
  }
}

/** The permission rules do not allow the current user what was requested (403, or 401 "not permitted"). */
export class NotPermittedError extends NamedError {
  constructor(message: string, options?: TypedErrorOptions) {
    super("NotPermittedError", message, options);
  }
}

/** The server rejected the session (401), and it could not be renewed. */
export class SessionExpiredError extends NamedError {
  constructor(message: string, options?: TypedErrorOptions) {
    super("SessionExpiredError", message, options);
  }
}

/** A write was rejected because the document has changed in the meantime (409). */
export class WriteConflictError extends NamedError {
  constructor(message: string, options?: TypedErrorOptions) {
    super("WriteConflictError", message, options);
  }
}

/** The device's local database (IndexedDB underneath PouchDB) is broken. */
export class LocalStorageError extends NamedError {
  constructor(message: string, options?: TypedErrorOptions) {
    super("LocalStorageError", message, options);
  }
}

type TypedErrorClass = new (
  message: string,
  options: TypedErrorOptions,
) => NamedError;

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
 * The names of the typed errors, for an error that lost its class: a copy that
 * PouchDB's replication makes of the error it failed with, or an exception of
 * a Sentry event without the original error object.
 */
const TYPED_ERROR_NAMES = new Map<string, ErrorClassification>([
  ["ConnectivityError", "connectivity"],
  ["ServerError", "server-error"],
  ["NotPermittedError", "not-permitted"],
  ["SessionExpiredError", "session-expired"],
  ["WriteConflictError", "write-conflict"],
  ["LocalStorageError", "local-storage"],
]);

/**
 * Create the typed error of a classification, for a boundary converting a
 * foreign error (keep that one as `cause`, and its `status`).
 */
export function createTypedError(
  classification: ErrorClassification,
  message: string,
  options: TypedErrorOptions,
): NamedError {
  return new TYPED_ERRORS[classification](message, options);
}

/** The classification of a typed error, by its class. */
function typedClassification(error: unknown): ErrorClassification | undefined {
  for (const [classification, type] of Object.entries(TYPED_ERRORS)) {
    if (error instanceof type) {
      return classification as ErrorClassification;
    }
  }
  return undefined;
}

/**
 * The classification of the typed error the given one only passes on, keeping
 * its message: a `DatabaseException` around the typed error of the database
 * layer (also wrapped again), or a framework re-throwing it.
 */
function passedOnClassification(
  error: unknown,
): ErrorClassification | undefined {
  let wrapper = error;
  for (const cause of causeChain(error).slice(1)) {
    if (
      !(wrapper instanceof Error) ||
      !(cause instanceof Error) ||
      wrapper.message !== cause.message
    ) {
      return undefined;
    }
    const typed = typedClassification(cause);
    if (typed) {
      return typed;
    }
    wrapper = cause;
  }
  return undefined;
}

/** Whether the error is one of the typed errors (by its class, else by its name). */
export function isTypedError(error: unknown): boolean {
  return (
    !!typedClassification(error) ||
    TYPED_ERROR_NAMES.has((error as { name?: string } | undefined)?.name)
  );
}

/**
 * HTTP statuses of a request that never reached the application's backend:
 * `0` for one that got no response at all, the others reported by an
 * infrastructure component in front of it.
 */
export const CONNECTIVITY_ERROR_STATUS = new Set([0, 502, 503, 504]);

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

/** CouchDB's `reason` for rejecting a request whose JWT `exp` claim has passed. */
const EXPIRED_TOKEN_REASON = "exp not in future";

/** Text the permission backend uses when the current user may not access a document or type. */
const NOT_PERMITTED_TEXT = "not permitted";

/** PouchDB's wording of a rejected write, for errors that lost their 409 status. */
const WRITE_CONFLICT_TEXT = "document update conflict";

/**
 * The classification of a failed response of our backend (the database or the
 * API), by its status and the texts the backend gave as reason. For the
 * boundaries where these responses enter the app and are converted into typed
 * errors (see {@link createTypedError}).
 *
 * `undefined` for a status the caller handles itself (e.g. 400, 404) and for a
 * 5xx: whether it is the server failing is for the boundary to judge (PouchDB
 * uses 500 for failures of the local database as well).
 */
export function classifyResponseStatus(
  status: unknown,
  reasons: unknown[],
): ErrorClassification | undefined {
  if (CONNECTIVITY_ERROR_STATUS.has(status as number)) {
    return "connectivity";
  }
  const texts = reasons
    .filter((text): text is string => typeof text === "string")
    .map((text) => text.toLowerCase());
  switch (status) {
    case HttpStatusCode.Unauthorized:
      if (texts.some((text) => text.includes(EXPIRED_TOKEN_REASON))) {
        return "session-expired";
      }
      // other 401 reasons (e.g. an invalid token signature) are misconfigurations
      return texts.some((text) => text.includes(NOT_PERMITTED_TEXT))
        ? "not-permitted"
        : undefined;
    case HttpStatusCode.Forbidden:
      return "not-permitted";
    case HttpStatusCode.Conflict:
      return "write-conflict";
    default:
      return undefined;
  }
}

/**
 * What kind of failure the given error is, judged by this one error (not its `cause`s):
 * by its type if it is one of our typed errors (also if it only passes one on,
 * keeping its message, see {@link passedOnClassification}); a foreign error by
 * its status, name and message (see {@link classifyForeignError}).
 *
 * A {@link LoggedError} or another error of ours is never classified by its text.
 */
export function classifyError(error: unknown): ErrorClassification | undefined {
  if (!error || (typeof error !== "object" && typeof error !== "string")) {
    return undefined;
  }
  const typed = typedClassification(error) ?? passedOnClassification(error);
  if (typed || error instanceof LoggedError || error instanceof NamedError) {
    return typed;
  }
  return classifyForeignError(error);
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
 * The fallback for foreign errors that never pass one of the boundaries
 * converting them into typed errors:
 * - unhandled browser errors, e.g. a failed `fetch` or chunk load;
 * - IndexedDB errors raised inside PouchDB's callbacks, outside our calls;
 * - errors of requests to other services than our backend: keycloak-js errors
 *   (with the whole `Response` attached) and `HttpErrorResponse`s of third-party
 *   services, as far as they did not reach the server (connectivity only);
 * - errors that lost their class: a Sentry event without the original error
 *   object, or a copy PouchDB's replication makes, by the name of our typed error.
 *
 * The boundaries use it as well, for the name and wording of a raw error.
 */
function classifyForeignError(
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
