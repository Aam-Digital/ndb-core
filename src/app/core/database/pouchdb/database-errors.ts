import {
  TypedError,
  TypedErrorOptions,
} from "../../logging/error-classification";

/**
 * The typed errors of the database: converted from PouchDB's and IndexedDB's
 * raw errors by `toTypedDatabaseError` (see `pouchdb-errors.ts`), a write
 * conflict also by the HTTP interceptor.
 */

/** A write was rejected because the document has changed in the meantime (409). */
export class WriteConflictError extends TypedError {
  constructor(message: string, options?: TypedErrorOptions) {
    super("WriteConflictError", "write-conflict", message, options);
  }
}

/** The device's local database (IndexedDB underneath PouchDB) is broken. */
export class LocalStorageError extends TypedError {
  constructor(message: string, options?: TypedErrorOptions) {
    super("LocalStorageError", "local-storage", message, options);
  }
}
