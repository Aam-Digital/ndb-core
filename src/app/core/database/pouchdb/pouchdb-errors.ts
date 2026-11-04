import {
  classifyError,
  type ErrorClassification,
} from "../../logging/error-classification";
import { errorText, isFailedFetch } from "#src/app/utils/backend-response";

/**
 * What the raw errors of PouchDB and of the IndexedDB underneath it say by their
 * name and wording, for the database boundary (`toTypedDatabaseError`) and for
 * such errors that reach remote monitoring without passing it (e.g. raised in
 * PouchDB's callbacks, or a failed replication logged as it is).
 */

/** PouchDB's name of a request to the server cut off by our timeout (see `RemotePouchDatabase`). */
const ABORTED_REQUEST_NAME = "AbortError";

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
 * The classification of a raw error of PouchDB or IndexedDB by its name and
 * wording (not by its status, see `classifyResponseStatus` for that):
 * - a request to the server that failed or was cut off while reading the response;
 * - a write conflict that lost its status (e.g. a replication checkpoint);
 * - a broken IndexedDB, unless the error is a programming error.
 */
export function classifyPouchDbError(
  error: unknown,
): ErrorClassification | undefined {
  const name = (error as { name?: unknown } | undefined)?.name as string;
  if (name === ABORTED_REQUEST_NAME) {
    return "connectivity";
  }
  if (LOCAL_STORAGE_ERROR_NAMES.has(name)) {
    return "local-storage";
  }
  if (isFailedFetch(error)) {
    return "connectivity";
  }
  const text = errorText(error);
  if (text.toLowerCase().includes(WRITE_CONFLICT_TEXT)) {
    return "write-conflict";
  }
  if (
    !PROGRAMMING_ERROR_NAMES.has(name) &&
    LOCAL_STORAGE_ERROR_PATTERNS.some((pattern) => text.includes(pattern))
  ) {
    return "local-storage";
  }
  return undefined;
}

/**
 * Whether the local database could not store a document itself (e.g. one nested
 * too deeply for IndexedDB), as opposed to a classified failure such as a broken
 * local database ("Failed to execute 'transaction' on 'IDBDatabase': The database
 * connection is closing").
 */
export function isDocumentWriteError(error: unknown): boolean {
  if (classifyError(error) || classifyPouchDbError(error)) {
    return false;
  }
  const text = errorText(error);
  return (
    text.includes("Maximum call stack size exceeded") ||
    text.includes("IDBObjectStore") ||
    text.includes("Failed to execute")
  );
}
