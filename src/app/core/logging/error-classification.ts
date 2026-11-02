import { HttpErrorResponse, HttpStatusCode } from "@angular/common/http";
import { LoggedError, NamedError } from "./reported-errors";

/**
 * What kind of failure an error is, for reporting it.
 *
 * Our own errors say it by their type: a boundary that knows what went wrong
 * throws a typed error (e.g. the remote database's fetch wrapper throws a
 * {@link ConnectivityError} or a {@link ServerError}); for a new kind of error,
 * extend one of these classes. Errors not created by us (raw browser, PouchDB or
 * HTTP errors, also wrapped in a `DatabaseException`) are classified by their
 * status, name and - as a last resort - by the message patterns below, which
 * are kept in this one file.
 *
 * What remote monitoring does with each classification is in
 * `sentry-event-processing.ts` (`REPORTING_POLICY`).
 */

/**
 * What kind of failure an error is, as far as reporting it is concerned:
 * derived by {@link classifyError} from the error's type
 * or, for errors not created by us, its status, name and message. Mapped to what
 * remote monitoring does with it in `sentry-event-processing.ts`.
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

/** A request that never reached our backend (no response at all, or a gateway status). */
export class ConnectivityError extends NamedError {
  readonly status?: number;

  constructor(
    message: string,
    options?: {
      status?: number;
      cause?: unknown;
      details?: Record<string, unknown>;
    },
  ) {
    super("ConnectivityError", message, options);
    this.status = options?.status;
  }
}

/** Our backend answered with a 5xx status other than a gateway status. */
export class ServerError extends NamedError {
  readonly status: number;

  constructor(
    message: string,
    options: {
      status: number;
      cause?: unknown;
      details?: Record<string, unknown>;
    },
  ) {
    super("ServerError", message, options);
    this.status = options.status;
  }
}

/**
 * HTTP statuses of a request that never reached the application's backend:
 * `0` for one that got no response at all, the others reported by an
 * infrastructure component in front of it.
 */
export const CONNECTIVITY_ERROR_STATUS = [0, 502, 503, 504];

/**
 * Error `name`s that browsers use for requests that were cut off before
 * completing, rather than answered with an error.
 */
const CONNECTIVITY_ERROR_NAMES = ["TimeoutError", "AbortError"];

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
const LOCAL_STORAGE_ERROR_NAMES = [
  // PouchDB's "idb" adapter could not open or use IndexedDB
  "indexed_db_went_bad",
];
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
const PROGRAMMING_ERROR_NAMES = [
  "TypeError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
];

/** CouchDB's `reason` for rejecting a request whose JWT `exp` claim has passed. */
const EXPIRED_TOKEN_REASON = "exp not in future";

/** Text the permission backend uses when the current user may not access a document or type. */
const NOT_PERMITTED_TEXT = "not permitted";

/** PouchDB's wording of a rejected write, for errors that lost their 409 status. */
const WRITE_CONFLICT_TEXT = "document update conflict";

/**
 * What kind of failure the given error is, judged by this one error (not its `cause`s):
 * by its type if it is one of ours, else by its status, name and message.
 *
 * A {@link LoggedError} or another error of ours is never classified by its text.
 */
export function classifyError(error: unknown): ErrorClassification | undefined {
  if (!error || (typeof error !== "object" && typeof error !== "string")) {
    return undefined;
  }
  if (error instanceof ConnectivityError) {
    return "connectivity";
  }
  if (error instanceof ServerError) {
    return "server-error";
  }
  if (error instanceof LoggedError) {
    return undefined;
  }
  return (
    classifyByStatus(error) ?? classifyByName(error) ?? classifyByMessage(error)
  );
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
  error?: unknown;
  message?: unknown;
  name?: unknown;
  originalName?: unknown;
};

function classifyByStatus(
  error: object | string,
): ErrorClassification | undefined {
  const err = error as ErrorLike;
  // `err.response.status` as well: a library that wraps `fetch` may hand on the
  // whole `Response` instead of lifting the status out of it (keycloak-js does)
  if (
    CONNECTIVITY_ERROR_STATUS.includes(err.status as number) ||
    CONNECTIVITY_ERROR_STATUS.includes(err.response?.status as number)
  ) {
    return "connectivity";
  }
  if (err.status === HttpStatusCode.Unauthorized) {
    if (
      typeof err.reason === "string" &&
      err.reason.includes(EXPIRED_TOKEN_REASON)
    ) {
      return "session-expired";
    }
    // other 401 reasons (e.g. an invalid token signature) are misconfigurations
    return [err.error, err.reason, err.message].some(
      (text) =>
        typeof text === "string" &&
        text.toLowerCase().includes(NOT_PERMITTED_TEXT),
    )
      ? "not-permitted"
      : undefined;
  }
  if (err.status === HttpStatusCode.Forbidden) {
    return "not-permitted";
  }
  if (err.status === HttpStatusCode.Conflict) {
    return "write-conflict";
  }
  // only a response of our backend: PouchDB uses 500 for local failures as well
  if (error instanceof HttpErrorResponse && error.status >= 500) {
    return "server-error";
  }
  return undefined;
}

function classifyByName(
  error: object | string,
): ErrorClassification | undefined {
  const err = error as ErrorLike;
  // `originalName`: the name of the error a DatabaseException wraps
  const names = [err.name, err.originalName] as string[];
  if (names.some((name) => CONNECTIVITY_ERROR_NAMES.includes(name))) {
    return "connectivity";
  }
  if (names.some((name) => LOCAL_STORAGE_ERROR_NAMES.includes(name))) {
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
  if (text.toLowerCase().includes(WRITE_CONFLICT_TEXT)) {
    return "write-conflict";
  }
  const isProgrammingError = PROGRAMMING_ERROR_NAMES.includes(
    err.name as string,
  );
  if (
    !isProgrammingError &&
    LOCAL_STORAGE_ERROR_PATTERNS.some((pattern) => text.includes(pattern))
  ) {
    return "local-storage";
  }
  return undefined;
}
