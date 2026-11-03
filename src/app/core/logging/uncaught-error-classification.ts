import { classifyError, ErrorClassification } from "./error-classification";
import { LoggedError, NamedError } from "./reported-errors";
import {
  CONNECTIVITY_ERROR_STATUS,
  errorText,
  isFailedFetch,
} from "#src/app/utils/backend-response";
import { classifyPouchDbError } from "../database/pouchdb/pouchdb-errors";

/**
 * The classification of an error that remote monitoring reports: by its type
 * (see {@link classifyError}), else as one of the few foreign errors that reach
 * it without passing a boundary that would have converted them
 * (see {@link classifyUncaughtError}).
 */
export function classifyReportedError(
  error: unknown,
): ErrorClassification | undefined {
  return classifyError(error) ?? classifyUncaughtError(error);
}

/**
 * Wordings of a lazily loaded application chunk that could not be fetched: the
 * device is offline, or a new deployment replaced the chunk the running app asks for.
 */
const CHUNK_LOAD_FAILURE_PATTERNS = [
  // Chrome/Edge: "Failed to fetch dynamically imported module: <url>"
  // Firefox: "error loading dynamically imported module: <url>"
  "dynamically imported module",
  "Importing a module script failed", // Safari
];

/**
 * ONLY for foreign error objects that reach us uncaught (Angular's `ErrorHandler`,
 * the window's error events) or are logged as they are, without a boundary
 * converting them into a typed error: everything else is judged by its type alone.
 * - a failed chunk load, a `fetch` that failed outside a boundary, or a failed
 *   request of another service (status 0, 502-504, e.g. of an `HttpErrorResponse`);
 * - a raw error of PouchDB or IndexedDB that no `DatabaseException` wraps, e.g.
 *   raised in PouchDB's callbacks (see `classifyPouchDbError` of the database module).
 *
 * Never for our own errors, and never for a string: a logged message is not
 * classified by its wording (e.g. "Failed to fetch roles" is no failed `fetch`).
 */
function classifyUncaughtError(
  error: unknown,
): ErrorClassification | undefined {
  if (
    !error ||
    typeof error !== "object" ||
    error instanceof LoggedError ||
    error instanceof NamedError
  ) {
    return undefined;
  }
  const text = errorText(error);
  if (
    CONNECTIVITY_ERROR_STATUS.has((error as { status?: number }).status) ||
    isFailedFetch(error) ||
    CHUNK_LOAD_FAILURE_PATTERNS.some((pattern) => text.includes(pattern))
  ) {
    return "connectivity";
  }
  return classifyPouchDbError(error);
}
