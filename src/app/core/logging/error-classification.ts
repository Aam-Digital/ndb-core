import { HttpErrorResponse, HttpStatusCode } from "@angular/common/http";
import {
  ErrorClassification,
  LoggedError,
  NamedError,
} from "./reported-errors";

export type { ErrorClassification } from "./reported-errors";

/**
 * Classify failures once, where they enter the app, by type and HTTP status.
 *
 * A boundary that knows what went wrong creates a typed error (e.g. the remote
 * database's fetch wrapper throws a {@link ConnectivityError} or a {@link ServerError}),
 * and `DatabaseException` records the classification of the PouchDB error it wraps.
 * {@link classifyError} reads that classification first; only an error that did not
 * pass through such a boundary (a raw browser or PouchDB error) is classified by
 * its status, name and - as a last resort - by the message patterns below, which
 * are kept in this one file.
 *
 * What remote monitoring does with each classification is in
 * `sentry-event-processing.ts` (`REPORTING_POLICY`).
 */

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
    super("ConnectivityError", message, {
      ...options,
      classification: "connectivity",
    });
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
    super("ServerError", message, {
      ...options,
      classification: "server-error",
    });
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
 * by the classification a boundary gave it, else by its status, name and message.
 *
 * A {@link LoggedError} is a log message of ours, never classified by its text.
 */
export function classifyError(error: unknown): ErrorClassification | undefined {
  if (!error || (typeof error !== "object" && typeof error !== "string")) {
    return undefined;
  }
  const explicit = (error as { classification?: ErrorClassification })
    .classification;
  if (explicit) {
    return explicit;
  }
  if (error instanceof LoggedError) {
    return undefined;
  }
  return (
    classifyByStatus(error) ?? classifyByName(error) ?? classifyByMessage(error)
  );
}

/**
 * A request that never reached our backend: no response, a gateway status
 * (0, 502-504), a timeout or abort. A 5xx other than these is a `ServerError`:
 * the server was reached and failed.
 */
export function isConnectivityError(err: unknown): boolean {
  return classifyError(err) === "connectivity";
}

/**
 * The permission rules exclude the record or type for the current user:
 * a 403, or a 401 the server explicitly calls "not permitted".
 */
export function isNotPermittedError(err: unknown): boolean {
  return classifyError(err) === "not-permitted";
}

const EXPECTED_FAILURES = new Set<ErrorClassification | undefined>([
  "connectivity",
  "session-expired",
  "not-permitted",
  "write-conflict",
]);

/**
 * A failure of the user's environment rather than a bug: offline, expired
 * session, missing permission, edit conflict (judged by the whole `cause` chain).
 */
export function isExpectedFailure(err: unknown): boolean {
  return EXPECTED_FAILURES.has(classifyErrorChain(err));
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
  const name = (error as ErrorLike).name as string;
  if (CONNECTIVITY_ERROR_NAMES.includes(name)) {
    return "connectivity";
  }
  if (LOCAL_STORAGE_ERROR_NAMES.includes(name)) {
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
